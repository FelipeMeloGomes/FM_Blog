/**
 * O papel de autor vive no token do usuário, como custom claim `author`.
 *
 * Não existe lista de UIDs no repositório nem coleção no Firestore: a
 * marcação é um atributo da conta, assinado pelo Firebase Auth dentro do ID
 * token. Regras (`request.auth.token.get('author', false)`) e interface leem
 * o mesmo claim — então adicionar ou remover um autor não exige deploy, só
 * uma alteração na conta (console ou Admin SDK).
 *
 * Depois de mudar o claim, o usuário só vê o efeito com um token novo:
 * logout/login, ou até 1 hora (tempo de vida do token).
 */
export const AUTHOR_CLAIM = "author";

/**
 * Lê o claim de autor de dentro dos claims de um ID token.
 *
 * @param claims - `tokenResult.claims` do Firebase Auth
 *
 * @example
 * ```ts
 * const { claims } = await user.getIdTokenResult();
 * if (hasAuthorClaim(claims)) { ... }
 * ```
 */
export const hasAuthorClaim = (claims?: Record<string, unknown> | null): boolean => {
  return claims?.[AUTHOR_CLAIM] === true;
};
