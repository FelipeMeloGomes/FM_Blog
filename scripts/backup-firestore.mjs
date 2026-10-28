// Backup manual do Firestore em JSON.
//
// Funciona no plano Spark: não usa export para Cloud Storage (que exige
// Blaze), só lê os documentos e grava um arquivo local. É o único backup
// gratuito além da janela de 1 hora que o Firestore mantém sozinho.
//
// Uso:
//   pnpm backup
//   FIREBASE_PROJECT=outro-projeto pnpm backup
//
// A credencial vem do Firebase CLI já autenticado nesta máquina. Nada é
// gravado no repositório além do arquivo em backups/, que é ignorado pelo git.
//
// O JSON guarda cada documento no formato da API REST (campos tipados:
// stringValue, integerValue, timestampValue...). Não há restauração
// automática: para voltar um documento, use o console ou a própria API REST.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const PROJECT = process.env.FIREBASE_PROJECT ?? "miniblog-b2776";
const COLLECTIONS = ["posts", "comments", "savedPosts", "userPreferences", "postViews"];
const CONFIG_PATH = join(homedir(), ".config", "configstore", "firebase-tools.json");
const BASE_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const readCliToken = () => {
  if (!existsSync(CONFIG_PATH)) return null;

  const { tokens } = JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  if (!tokens?.access_token) return null;

  return {
    token: tokens.access_token,
    // Renova um minuto antes de expirar, para não falhar no meio da leitura.
    valid: Number(tokens.expires_at ?? 0) > Date.now() + 60_000,
  };
};

const getToken = () => {
  const current = readCliToken();
  if (!current) {
    throw new Error(
      `Nenhuma credencial do Firebase CLI em ${CONFIG_PATH}.\nRode: npx firebase-tools login`
    );
  }
  if (current.valid) return current.token;

  console.log("Token do CLI expirado. Renovando com o próprio CLI...");
  // Qualquer comando do CLI renova o access token e regrava o arquivo.
  execFileSync("npx", ["--yes", "firebase-tools@15", "projects:list"], {
    stdio: "ignore",
    shell: process.platform === "win32",
  });

  const renewed = readCliToken();
  if (!renewed?.valid) {
    throw new Error("Não foi possível renovar o token. Rode: npx firebase-tools login --reauth");
  }
  return renewed.token;
};

const listCollection = async (token, collection) => {
  const documents = [];
  let pageToken;

  do {
    const url = new URL(`${BASE_URL}/${collection}`);
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) {
      throw new Error(`${collection}: HTTP ${response.status} — ${await response.text()}`);
    }

    const page = await response.json();
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken;
  } while (pageToken);

  return documents;
};

const main = async () => {
  const token = getToken();
  const startedAt = new Date();
  const collections = {};

  for (const name of COLLECTIONS) {
    collections[name] = await listCollection(token, name);
    console.log(`${name.padEnd(16)} ${String(collections[name].length).padStart(4)} documento(s)`);
  }

  const stamp = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const directory = join(process.cwd(), "backups");
  const file = join(directory, `firestore-${stamp}.json`);

  mkdirSync(directory, { recursive: true });
  writeFileSync(
    file,
    `${JSON.stringify({ project: PROJECT, exportedAt: startedAt.toISOString(), collections }, null, 2)}\n`
  );

  const total = Object.values(collections).reduce((sum, docs) => sum + docs.length, 0);
  console.log(`\n${total} documento(s) em ${file}`);
};

main().catch((error) => {
  console.error(`\nFalhou: ${error.message}`);
  process.exit(1);
});
