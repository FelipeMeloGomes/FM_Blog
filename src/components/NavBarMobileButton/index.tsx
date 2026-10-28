import { MdAdd, MdDashboard, MdHome, MdInfo, MdPerson } from "react-icons/md";
import { isAuthor } from "../../utils/authors";
import type { ButtonConfig } from "./types";

interface NavBarUser {
  id?: string;
  name?: string;
  email?: string;
  uid?: string | null;
}

export const getButtonData = (user: NavBarUser | null | undefined): ButtonConfig[] => [
  { text: "Home", to: "/", icon: <MdHome />, show: true },
  { text: "Entrar", to: "/login", icon: <MdPerson />, show: !user },
  { text: "Cadastrar", to: "/register", icon: <MdAdd />, show: !user },
  { text: "Novo Post", to: "/posts/create", icon: <MdAdd />, show: isAuthor(user?.uid) },
  { text: "Dashboard", to: "/dashboard", icon: <MdDashboard />, show: !!user },
  { text: "Sobre", to: "/about", icon: <MdInfo />, show: true },
];
