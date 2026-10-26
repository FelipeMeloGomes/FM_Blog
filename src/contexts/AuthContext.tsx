import { createContext, useContext } from "react";
import type { AuthContextType, AuthProviderProps, AuthValue } from "./AuthContext.types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children, value }: AuthProviderProps) => {
  return <AuthContext.Provider value={{ authValue: value }}>{children}</AuthContext.Provider>;
};

export const useAuthValue = (): AuthValue | undefined => {
  const context = useContext(AuthContext);
  return context?.authValue;
};
