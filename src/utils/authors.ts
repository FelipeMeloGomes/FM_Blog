/**
 * Contas com permissão de publicar no blog.
 *
 * Esta lista precisa espelhar a função `isAuthor()` de `firestore.rules`.
 * A regra é a fonte da verdade — o Firestore é quem bloqueia; esta lista só
 * evita mostrar botões e rotas que vão falhar com "permission denied".
 *
 * O UID não é segredo: ele já aparece publicamente no campo `uid` dos posts.
 */
export const AUTHOR_UIDS = ["3mgWMmUyNvW2iIJyTirGhxHt4hE3"];

/**
 * Verifica se o usuário logado pode publicar, editar e excluir posts.
 *
 * @param uid - UID do usuário autenticado (ou `null`/`undefined` se anônimo)
 *
 * @example
 * ```tsx
 * const { user } = useAuthValue() ?? {};
 * {isAuthor(user?.uid) && <Link to="/posts/create">Novo post</Link>}
 * ```
 */
export const isAuthor = (uid?: string | null): boolean => {
  return uid != null && AUTHOR_UIDS.includes(uid);
};
