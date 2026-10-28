import { type User as FirebaseUser, onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { hasAuthorClaim } from "../utils/authors";
import { useAuthentication } from "./useAuthentication";

interface CustomUser extends Omit<FirebaseUser, "photoURL"> {
  id: string;
  name: string;
  email: string;
  photoURL?: string | null;
  /** Custom claim `author`, lido do ID token. */
  isAuthor: boolean;
}

/**
 * Hook para obter o estado de autenticação do usuário atual.
 * Fornece o usuário logado com loading state para evitar flash de conteúdo.
 *
 * O papel de autor vem do custom claim `author` do ID token — não de uma
 * lista no código. Token emitido antes da marcação continua sem o claim até
 * expirar (1h) ou até o próximo login.
 *
 * @returns Objeto com usuário e estado de loading
 *
 * @example
 * ```tsx
 * const { user, loading } = useAuthState();
 *
 * if (loading) return <Skeleton />;
 * if (!user) return <LoginForm />;
 * return <Dashboard user={user} />;
 * ```
 */
export const useAuthState = (): { user: CustomUser | null; loading: boolean } => {
  const { auth } = useAuthentication();
  const [user, setUser] = useState<CustomUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    let active = true;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!active) return;

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // getIdTokenResult usa o token em cache; só a marcação é lida dele.
      const tokenResult = await currentUser.getIdTokenResult().catch(() => null);
      if (!active) return;

      const customUser: CustomUser = {
        ...currentUser,
        id: currentUser.uid,
        name: currentUser.displayName || "Nome não disponível",
        email: currentUser.email ?? "",
        photoURL: currentUser.photoURL,
        isAuthor: hasAuthorClaim(tokenResult?.claims),
      };
      setUser(customUser);
      setLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [auth]);

  return { user, loading };
};
