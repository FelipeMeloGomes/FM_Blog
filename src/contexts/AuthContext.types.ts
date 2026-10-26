import type { ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  uid?: string;
  photoURL?: string | null;
}

export interface AuthValue {
  isAuthenticated?: boolean;
  user: User | null;
}

export interface AuthContextType {
  authValue: AuthValue | undefined;
}

export interface AuthProviderProps {
  children: ReactNode;
  value: AuthValue;
}
