import { useEffect, useRef, useState } from "react";
import { FiMenu, FiMoon, FiSun, FiX } from "react-icons/fi";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useColorMode } from "../../contexts/ColorModeContext";
import { isAuthor } from "../../utils/authors";

interface NavBarMobileProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
    uid?: string | null;
  } | null;
  logout: () => void;
}

const NavBarMobile = ({ user, logout }: NavBarMobileProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();
  const isDark = colorMode === "dark";
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const menuItems = [
    { text: "Início", to: "/", show: true },
    { text: "Entrar", to: "/login", show: !user },
    { text: "Cadastrar", to: "/register", show: !user },
    { text: "Novo Post", to: "/posts/create", show: isAuthor(user?.uid) },
    { text: "Meu Perfil", to: "/profile", show: !!user },
    { text: "Meus Posts", to: "/dashboard", show: !!user },
    { text: "Posts Salvos", to: "/saved", show: !!user },
    { text: "Sobre", to: "/about", show: true },
  ];

  return (
    <div className="md:hidden" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg hover:bg-secondary/50 transition-colors"
      >
        {isOpen ? <FiX size={22} /> : <FiMenu size={22} />}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-card rounded-xl border shadow-lg py-2 animate-in fade-in duration-200">
          <div className="flex flex-col">
            {menuItems
              .filter((item) => item.show)
              .map((item) => {
                const isActive = location.pathname === item.to;
                return (
                  <RouterLink
                    key={item.text}
                    to={item.to}
                    onClick={() => setIsOpen(false)}
                    className={`px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-primary bg-primary/10"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    {item.text}
                  </RouterLink>
                );
              })}
            {user && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
              >
                Sair
              </button>
            )}

            <div className="border-t my-2" />
            <button
              type="button"
              onClick={toggleColorMode}
              className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              {isDark ? <FiSun size={18} /> : <FiMoon size={18} />}
              <span>{isDark ? "Modo claro" : "Modo escuro"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export { NavBarMobile };
