// Teste de comportamento das firestore.rules contra o emulador local.
//
// Cada cenário reproduz o payload exato de um hook do app e roda contra o
// mesmo firestore.rules que vai para produção — o emulador lê o arquivo do
// repositório. Duas contas são usadas: uma com o custom claim `author` e
// outra sem, que é justamente a distinção que as regras fazem hoje.
//
// Uso: pnpm test:rules   (sobe os emuladores, roda, derruba)
// Sem Java no PATH, o Firebase CLI não inicia o emulador.
import { initializeApp } from "firebase/app";
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const PROJECT = process.env.FB_PROJECT ?? "demo-fmblog";
const HOST = "127.0.0.1";
const FS_PORT = Number(process.env.FS_PORT ?? 8090);
const AUTH_PORT = Number(process.env.AUTH_PORT ?? 9098);

// O uid em si nao importa para as regras (quem decide e o claim), mas usar o
// uid real do dono garante que o teste continua valido se alguem reintroduzir
// um atalho por uid no futuro.
const AUTHOR_UID = "3mgWMmUyNvW2iIJyTirGhxHt4hE3";
const AUTHOR_EMAIL = "autor@teste.local";
const AUTHOR_PASSWORD = "senha123456";

const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: `${PROJECT}.firebaseapp.com`,
  projectId: PROJECT,
  appId: "1:000000000000:web:0000000000000000000000",
};

const makeApp = (name) => {
  const app = initializeApp(firebaseConfig, name);
  const auth = getAuth(app);
  connectAuthEmulator(auth, `http://${HOST}:${AUTH_PORT}`, { disableWarnings: true });
  const db = getFirestore(app);
  connectFirestoreEmulator(db, HOST, FS_PORT);
  return { auth, db };
};

const adminCreateUser = async (localId, email, password, displayName) => {
  const res = await fetch(
    `http://${HOST}:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({ localId, email, password, displayName }),
    }
  );
  const body = await res.text();
  if (!res.ok && !/EMAIL_EXISTS|DUPLICATE/i.test(body)) {
    throw new Error(`falha ao criar usuario admin: ${res.status} ${body}`);
  }
};

const signIn = async (tag, email, password) => {
  const { auth, db } = makeApp(tag);
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return { auth, db, uid: cred.user.uid, name: cred.user.displayName ?? email, email };
};

// Define (ou limpa) os custom claims da conta, como faria o Admin SDK.
const setCustomClaim = async (uid, claims) => {
  const res = await fetch(
    `http://${HOST}:${AUTH_PORT}/identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:update`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
      body: JSON.stringify({ localId: uid, customAttributes: JSON.stringify(claims) }),
    }
  );
  if (!res.ok) throw new Error(`falha ao definir claim: ${res.status} ${await res.text()}`);
};

const newUser = async (tag) => {
  const { auth, db } = makeApp(tag);
  const email = `${tag}@teste.local`;
  const cred = await createUserWithEmailAndPassword(auth, email, "senha123456");
  await updateProfile(cred.user, { displayName: `Usuario ${tag}` });
  return { auth, db, uid: cred.user.uid, name: `Usuario ${tag}`, email };
};

const results = [];
const test = async (name, fn, expect) => {
  let outcome;
  try {
    await fn();
    outcome = "allow";
  } catch (e) {
    const code = e?.code ?? "";
    const msg = String(e?.message ?? e);
    outcome =
      code === "permission-denied" || /permission|insufficient|PERMISSION_DENIED/i.test(msg)
        ? "deny"
        : `error(${code || msg})`;
  }
  const pass = outcome === expect;
  results.push({ name, expect, outcome, pass });
  console.log(
    `${pass ? "PASS" : "FAIL"}  ${name.padEnd(58)} esperado=${expect.padEnd(5)} obtido=${outcome}`
  );
};

// ---------------- payloads copiados dos hooks ----------------
const postPayload = (actor) => ({
  title: "Post de teste automatizado",
  titleLower: "post de teste automatizado",
  image: "https://example.com/capa.png",
  body: "Conteudo do post com bastante texto para passar da validacao.",
  tagsArray: ["teste", "regras"],
  uid: actor.uid,
  createdBy: actor.name,
  photoURL: "",
  likeCount: 0,
  likes: [],
  createdAt: Timestamp.now(),
});

const editPostPayload = (actor, title) => ({
  title,
  titleLower: title.toLowerCase(),
  image: "https://example.com/capa.png",
  body: "Conteudo do post com bastante texto para passar da validacao.",
  tagsArray: ["teste", "regras"],
  uid: actor.uid,
  createdBy: actor.name,
  photoURL: "",
  likeCount: 0,
  likes: [],
});

const commentPayload = (actor, postId) => ({
  postId,
  userId: actor.uid,
  userName: actor.name,
  userAvatar: null,
  content: "Comentario de teste automatizado",
  createdAt: serverTimestamp(),
  parentId: null,
  likes: [],
  likeCount: 0,
});

const toggleLike = (db, coll, id, uid) =>
  runTransaction(db, async (t) => {
    const ref = doc(db, coll, id);
    const snap = await t.get(ref);
    const has = snap.data()?.likes?.includes(uid) ?? false;
    t.update(ref, {
      likes: has ? arrayRemove(uid) : arrayUnion(uid),
      likeCount: increment(has ? -1 : 1),
    });
  });

// Cria um documento ignorando as regras (request do emulador como owner),
// para simular dados que ja existiam antes da regra de autor entrar no ar.
const seedAsOwner = async (collectionId, docId, data) => {
  const url =
    `http://${HOST}:${FS_PORT}/v1/projects/${PROJECT}/databases/(default)/documents/` +
    `${collectionId}?documentId=${docId}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer owner" },
    body: JSON.stringify({
      fields: {
        uid: { stringValue: data.uid },
        title: { stringValue: data.title },
        titleLower: { stringValue: data.title.toLowerCase() },
        body: { stringValue: "Conteudo legado com bastante texto." },
        image: { stringValue: "https://example.com/legado.png" },
        createdBy: { stringValue: data.createdBy },
        photoURL: { stringValue: "" },
        tagsArray: { arrayValue: { values: [{ stringValue: "legado" }] } },
        likes: { arrayValue: { values: [] } },
        likeCount: { integerValue: "0" },
      },
    }),
  });
  if (!res.ok) throw new Error(`seed falhou: ${res.status} ${await res.text()}`);
  return docId;
};

// ---------------- montagem dos cenarios ----------------
const anon = makeApp("anon");

await adminCreateUser(AUTHOR_UID, AUTHOR_EMAIL, AUTHOR_PASSWORD, "Felipe Melo");
// O papel vem do claim, nao do uid: a conta precisa estar marcada antes do login.
await setCustomClaim(AUTHOR_UID, { author: true });
const A = await signIn("user-autor", AUTHOR_EMAIL, AUTHOR_PASSWORD);
const B = await newUser("leitor");

if (A.uid !== AUTHOR_UID) {
  console.error(`ABORTADO: o autor entrou com uid ${A.uid}, esperado ${AUTHOR_UID}`);
  process.exit(1);
}

let postId;
let commentId;

await test("posts: autor com claim cria (payload do CreatePost)", async () => {
  const ref = await addDoc(collection(A.db, "posts"), postPayload(A));
  postId = ref.id;
}, "allow");

// NOVO: a brecha que estamos fechando
await test("posts: NAO autor cria", () => addDoc(collection(B.db, "posts"), postPayload(B)), "deny");

await test("posts: anonimo le", () => getDoc(doc(anon.db, "posts", postId)), "allow");

await test("posts: nao-autor edita post do autor", () =>
  updateDoc(doc(B.db, "posts", postId), { title: "Invasao do post" }), "deny");

await test("posts: autor edita titulo (payload do EditPost)", () =>
  updateDoc(doc(A.db, "posts", postId), editPostPayload(A, "Post de teste editado")), "allow");

await test("posts: autor tenta trocar uid (transferir autoria)", () =>
  updateDoc(doc(A.db, "posts", postId), { uid: B.uid }), "deny");

await test("posts: autor tenta inflar likeCount", () =>
  updateDoc(doc(A.db, "posts", postId), { likeCount: 9999 }), "deny");

await test("posts: leitor curte (regra de likes segue aberta)", () =>
  toggleLike(B.db, "posts", postId, B.uid), "allow");

await test("posts: like duplicado nao infla contador", () =>
  updateDoc(doc(B.db, "posts", postId), {
    likes: arrayUnion(B.uid),
    likeCount: increment(1),
  }), "deny");

await test("posts: leitor descurte", () => toggleLike(B.db, "posts", postId, B.uid), "allow");

await test("posts: contador voltou a zero apos descurtir", async () => {
  const snap = await getDoc(doc(A.db, "posts", postId));
  const d = snap.data();
  if (d.likeCount !== 0 || d.likes.length !== 0) throw new Error("contador inconsistente");
}, "allow");

await test("posts: anonimo tenta escrever views", () =>
  updateDoc(doc(anon.db, "posts", postId), { views: increment(1) }), "deny");

await test("posts: autor tenta escrever views (campo desativado)", () =>
  updateDoc(doc(A.db, "posts", postId), { views: increment(1) }), "deny");

// NOVO: post legado de um nao-autor (existe em producao hoje)
const legacyId = await seedAsOwner("posts", "post-legado-leitor", {
  uid: B.uid,
  title: "Post antigo do leitor",
  createdBy: B.name,
});

await test("posts: nao-autor edita o proprio post antigo", () =>
  updateDoc(doc(B.db, "posts", legacyId), { title: "Editado pelo autor antigo" }), "deny");

await test("posts: nao-autor apaga o proprio post antigo", () =>
  deleteDoc(doc(B.db, "posts", legacyId)), "deny");

await test("posts: autor apaga post antigo de outro", () =>
  deleteDoc(doc(A.db, "posts", legacyId)), "deny");

await test("posts: post legado continua no banco", async () => {
  const snap = await getDoc(doc(anon.db, "posts", legacyId));
  if (!snap.exists()) throw new Error("post legado foi removido");
}, "allow");

// ---------------- custom claim `author` ----------------
// A conta do leitor continua a mesma; o que muda e o claim no token dela.
let postDoClaim;

await test("claim: leitor sem claim nao publica", () =>
  addDoc(collection(B.db, "posts"), postPayload(B)), "deny");

await test("claim: concedido na conta (sem deploy)", () =>
  setCustomClaim(B.uid, { author: true }), "allow");

const B2 = await signIn("leitor-claim", B.email, "senha123456");

await test("claim: token novo publica", async () => {
  const ref = await addDoc(collection(B2.db, "posts"), postPayload(B2));
  postDoClaim = ref.id;
}, "allow");

await test("claim: token novo edita o proprio post", () =>
  updateDoc(doc(B2.db, "posts", postDoClaim), editPostPayload(B2, "Post do autor com claim")), "allow");

await test("claim: mesmo com claim, nao edita post de outro", () =>
  updateDoc(doc(B2.db, "posts", postId), { title: "Invasao com claim" }), "deny");

await test("claim: revogado na conta (sem deploy)", () => setCustomClaim(B.uid, {}), "allow");

const B3 = await signIn("leitor-revogado", B.email, "senha123456");

await test("claim: token novo apos revogar nao publica", () =>
  addDoc(collection(B3.db, "posts"), postPayload(B3)), "deny");

await test("claim: apos revogar nao edita mais o proprio post", () =>
  updateDoc(doc(B3.db, "posts", postDoClaim), { title: "Edicao apos revogar" }), "deny");

await test("posts: post do autor com claim segue publicado", async () => {
  const snap = await getDoc(doc(anon.db, "posts", postDoClaim));
  if (!snap.exists()) throw new Error("post sumiu");
}, "allow");

await test("comments: leitor comenta", async () => {
  const ref = await addDoc(collection(B.db, "comments"), commentPayload(B, postId));
  commentId = ref.id;
}, "allow");

await test("comments: autor comenta", async () => {
  await addDoc(collection(A.db, "comments"), commentPayload(A, postId));
}, "allow");

await test("comments: autor tenta tomar comentario do leitor (IDOR)", () =>
  updateDoc(doc(A.db, "comments", commentId), { userId: A.uid, content: "tomado" }), "deny");

await test("comments: leitor edita comentario do autor", async () => {
  const snap = await getDocs(query(collection(anon.db, "comments"), where("userId", "==", A.uid)));
  const target = snap.docs[0];
  await updateDoc(doc(B.db, "comments", target.id), { content: "alterado" });
}, "deny");

await test("comments: autor edita o proprio comentario", async () => {
  const snap = await getDocs(query(collection(anon.db, "comments"), where("userId", "==", A.uid)));
  await updateDoc(doc(A.db, "comments", snap.docs[0].id), { content: "editado pelo autor" });
}, "allow");

await test("comments: autor troca postId do comentario", async () => {
  const snap = await getDocs(query(collection(anon.db, "comments"), where("userId", "==", A.uid)));
  await updateDoc(doc(A.db, "comments", snap.docs[0].id), { postId: "outro-post" });
}, "deny");

await test("comments: conteudo acima de 2000 chars", async () => {
  const snap = await getDocs(query(collection(anon.db, "comments"), where("userId", "==", A.uid)));
  await updateDoc(doc(A.db, "comments", snap.docs[0].id), { content: "x".repeat(2001) });
}, "deny");

await test("comments: autor curte comentario do leitor", () =>
  toggleLike(A.db, "comments", commentId, A.uid), "allow");

await test("comments: autor apaga comentario do leitor", () =>
  deleteDoc(doc(A.db, "comments", commentId)), "deny");

await test("comments: leitor apaga o proprio comentario", () =>
  deleteDoc(doc(B.db, "comments", commentId)), "allow");

await test("postViews: cria com id derivado correto", () =>
  setDoc(doc(A.db, "postViews", `${postId}_${A.uid}`), {
    postId,
    userId: A.uid,
    createdAt: new Date(),
  }), "allow");

await test("postViews: leitor cria a propria view", () =>
  setDoc(doc(B.db, "postViews", `${postId}_${B.uid}`), {
    postId,
    userId: B.uid,
    createdAt: new Date(),
  }), "allow");

await test("postViews: cria com id arbitrario (inflar contagem)", () =>
  setDoc(doc(B.db, "postViews", `falso-${B.uid}`), {
    postId,
    userId: B.uid,
    createdAt: new Date(),
  }), "deny");

await test("postViews: regravar o mesmo doc", () =>
  setDoc(doc(A.db, "postViews", `${postId}_${A.uid}`), {
    postId,
    userId: A.uid,
    createdAt: new Date(),
  }), "deny");

await test("postViews: anonimo le (necessario para o contador)", () =>
  getDocs(collection(anon.db, "postViews")), "allow");

await test("savedPosts: autor salva", () =>
  setDoc(doc(collection(A.db, "savedPosts")), {
    postId,
    userId: A.uid,
    createdAt: serverTimestamp(),
  }), "allow");

await test("savedPosts: leitor le os salvos do autor", () =>
  getDocs(query(collection(B.db, "savedPosts"), where("userId", "==", A.uid))), "deny");

await test("savedPosts: autor le os proprios", () =>
  getDocs(query(collection(A.db, "savedPosts"), where("userId", "==", A.uid))), "allow");

await test("userPreferences: autor grava as proprias", () =>
  setDoc(doc(A.db, "userPreferences", A.uid), { colorMode: "dark" }, { merge: true }), "allow");

await test("userPreferences: autor grava no doc do leitor", () =>
  setDoc(doc(A.db, "userPreferences", B.uid), { colorMode: "dark" }, { merge: true }), "deny");

await test("userPreferences: valor invalido de colorMode", () =>
  setDoc(doc(A.db, "userPreferences", A.uid), { colorMode: "neon" }, { merge: true }), "deny");

await test("rateLimits removida: autor le", () => getDoc(doc(A.db, "rateLimits", "abc")), "deny");

await test("rateLimits removida: autor grava", () =>
  setDoc(doc(A.db, "rateLimits", "abc"), {
    email: "x@y.z",
    attempts: [1],
    updatedAt: serverTimestamp(),
  }), "deny");

await test("posts: leitor apaga post do autor", () => deleteDoc(doc(B.db, "posts", postId)), "deny");

await test("posts: autor apaga o proprio post", () => deleteDoc(doc(A.db, "posts", postId)), "allow");

// ---------------- fallback removido: uid sozinho nao vale mais ----------------
// A conta continua com o uid real do dono; o que saiu das regras foi o atalho
// que liberava esse uid mesmo sem o claim.
await test("sem fallback: conta do dono sem claim nao publica", async () => {
  await setCustomClaim(AUTHOR_UID, {});
  const semClaim = await signIn("autor-sem-claim", AUTHOR_EMAIL, AUTHOR_PASSWORD);
  await addDoc(collection(semClaim.db, "posts"), postPayload(semClaim));
}, "deny");

await test("sem fallback: devolvendo o claim, publica de novo", async () => {
  await setCustomClaim(AUTHOR_UID, { author: true });
  const comClaim = await signIn("autor-claim-de-volta", AUTHOR_EMAIL, AUTHOR_PASSWORD);
  const ref = await addDoc(collection(comClaim.db, "posts"), postPayload(comClaim));
  await deleteDoc(doc(comClaim.db, "posts", ref.id));
}, "allow");

const failures = results.filter((r) => !r.pass);
console.log(`\n${results.length - failures.length}/${results.length} cenarios passaram`);
if (failures.length) {
  console.log("\nFALHAS:");
  for (const f of failures) console.log(` - ${f.name} (esperado ${f.expect}, obtido ${f.outcome})`);
  process.exit(1);
}
// O SDK mantem a conexao gRPC aberta; encerra explicitamente.
process.exit(0);
