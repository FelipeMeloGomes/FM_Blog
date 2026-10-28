import { Link as RouterLink } from "react-router-dom";
import { useAuthValue } from "../../contexts/AuthContext";
import { useAuthentication } from "../../hooks/useAuthentication";
import { isAuthor } from "../../utils/authors";
import { AvatarMenu } from "../AvatarMenu";
import { ColorModeToggle } from "../ColorModeToggle";
import { NavBarMobile } from "../NavBarMobile";

const NavBar = () => {
  const auth = useAuthValue();
  const user = auth?.user ?? null;
  const { logout } = useAuthentication();

  return (
    <nav className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="max-w-5xl mx-auto px-4 py-3.5 flex justify-between items-center">
        <RouterLink
          to="/"
          className="font-heading text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          FM<span className="text-primary">.</span>Blog
        </RouterLink>

        <div className="hidden md:flex items-center gap-1">
          <RouterLink
            to="/"
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all duration-200"
          >
            Início
          </RouterLink>

          {user ? (
            <>
              {isAuthor(user.uid) && (
                <RouterLink
                  to="/posts/create"
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all duration-200"
                >
                  Criar post
                </RouterLink>
              )}
              <div className="ml-2 pl-4 border-l border-border/50">
                <AvatarMenu user={user} logout={logout} />
              </div>
              <ColorModeToggle />
            </>
          ) : (
            <>
              <RouterLink
                to="/login"
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-all duration-200"
              >
                Entrar
              </RouterLink>
              <RouterLink
                to="/register"
                className="ml-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-sm transition-all duration-200 active:scale-[0.98]"
              >
                Cadastrar
              </RouterLink>
              <ColorModeToggle />
            </>
          )}
        </div>

        <NavBarMobile user={user || null} logout={logout} />
      </div>
    </nav>
  );
};

export { NavBar };
