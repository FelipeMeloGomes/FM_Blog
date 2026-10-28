import { Navigate } from "react-router-dom";
import { useAuthState } from "../../hooks/useAuthState";
import { isAuthor } from "../../utils/authors";

interface AuthorRouteProps {
  children: React.ReactNode;
}

/**
 * Rota restrita a quem pode publicar.
 *
 * Complementa `PrivateRoute`: além de exigir login, exige que o uid esteja em
 * `AUTHOR_UIDS` — a mesma lista da função `isAuthor()` de `firestore.rules`.
 * Quem não é autor volta para a home em vez de ver um formulário que só
 * falharia no envio ("permission denied").
 */
export function AuthorRoute({ children }: AuthorRouteProps) {
  const { user, loading } = useAuthState();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-8 w-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthor(user.uid)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
