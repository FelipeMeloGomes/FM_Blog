import {
  type AuthError,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { useEffect, useState } from "react";
import { auth } from "../firebase/config";
import { errorMessages } from "../utils/ErrorMessage";
import type { AuthenticationResult, AuthenticationState, UserData } from "./types";
import {
  checkRateLimitFirestore,
  clearRateLimitFirestore,
  recordFailedAttemptFirestore,
} from "./useRateLimit";
import { useToastNotification } from "./useToastNotification";

/**
 * Hook para gerenciar autenticação com Firebase.
 * Fornece funções para login, registro, logout, login com Google e reset de senha.
 * Inclui rate limiting para prevenir ataques de força bruta.
 *
 * @returns Objeto com funções de autenticação e estado atual
 *
 * @example
 * ```tsx
 * const { login, createUser, logout, user, loading } = useAuthentication();
 *
 * await login({ email: "user@example.com", password: "password123" });
 * ```
 */
export const useAuthentication = (): AuthenticationResult => {
  const [state, setState] = useState<AuthenticationState>({
    error: null,
    loading: false,
    cancelled: false,
    user: null,
    token: null,
  });

  const { showToast } = useToastNotification();

  const handleErrorMessage = (error: AuthError): string => {
    const matchedError = Object.entries(errorMessages).find(([key]) => error.message.includes(key));

    return matchedError
      ? matchedError[1]
      : "Ocorreu um erro, por favor tente novamente mais tarde.";
  };

  const checkIfIsCancelled = (): void => {
    if (state.cancelled) {
      return;
    }
  };

  const createUser = async (data: UserData): Promise<void> => {
    checkIfIsCancelled();

    const rateLimit = await checkRateLimitFirestore(data.email);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.waitSeconds / 60);
      const errorMessage = `Muitas tentativas de registro. Tente novamente em ${minutes} minuto(s).`;
      showToast({
        title: "Erro",
        description: errorMessage,
        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
      }));
      throw new Error(errorMessage);
    }

    setState({ ...state, loading: true });
    try {
      const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(user, { displayName: data.displayName });
      const token = await getIdToken(user);
      await clearRateLimitFirestore(data.email);
      setState({ ...state, user, token });
      showToast({
        title: "Success",
        description: "Usuário registrado com sucesso.",
        status: "success",
      });
    } catch (error) {
      await recordFailedAttemptFirestore(data.email);
      const errorMessage = handleErrorMessage(error as AuthError);
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
        cancelled: false,
        token: null,
        user: null,
      }));

      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      });
      throw new Error(errorMessage);
    }
  };

  const logout = async (): Promise<void> => {
    checkIfIsCancelled();
    await signOut(auth);
    setState({ ...state, user: null, token: null });
  };

  const login = async (data: Omit<UserData, "displayName">): Promise<void> => {
    checkIfIsCancelled();

    const rateLimit = await checkRateLimitFirestore(data.email);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.waitSeconds / 60);
      const errorMessage = `Muitas tentativas de login. Tente novamente em ${minutes} minuto(s).`;
      showToast({
        title: "Erro",
        description: errorMessage,
        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
      }));
      throw new Error(errorMessage);
    }

    setState({ ...state, loading: true, error: null });
    try {
      const { user } = await signInWithEmailAndPassword(auth, data.email, data.password);
      // Força um token novo: o claim `author` pode ter mudado desde o último login.
      const token = await getIdToken(user, true);
      await clearRateLimitFirestore(data.email);
      setState({ ...state, user, token });
      showToast({
        title: "Success",

        description: "Login efetuado com sucesso.",
        status: "success",
      });
    } catch (error) {
      await recordFailedAttemptFirestore(data.email);
      const errorMessage = handleErrorMessage(error as AuthError);
      showToast({
        title: "Error",
        description: errorMessage,

        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
        cancelled: false,
      }));
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    checkIfIsCancelled();
    const provider = new GoogleAuthProvider();
    setState({ ...state, loading: true, error: null });
    try {
      const { user } = await signInWithPopup(auth, provider);
      // Força um token novo: o claim `author` pode ter mudado desde o último login.
      const token = await getIdToken(user, true);
      setState({ ...state, user, token });
      showToast({
        title: "Success",
        description: "Login efetuado com sucesso no Google.",
        status: "success",
      });
    } catch (error) {
      const errorMessage = handleErrorMessage(error as AuthError);
      showToast({
        title: "Error",
        description: errorMessage,

        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
        cancelled: false,
      }));
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    checkIfIsCancelled();

    const rateLimit = await checkRateLimitFirestore(`reset:${email}`);
    if (!rateLimit.allowed) {
      const minutes = Math.ceil(rateLimit.waitSeconds / 60);
      const errorMessage = `Muitas tentativas de recuperação de senha. Tente novamente em ${minutes} minuto(s).`;
      showToast({
        title: "Erro",
        description: errorMessage,
        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
      }));
      throw new Error(errorMessage);
    }

    setState({ ...state, loading: true });
    try {
      await sendPasswordResetEmail(auth, email);
      await recordFailedAttemptFirestore(`reset:${email}`);
      showToast({
        title: "Success",
        description: "E-mail de redefinição de senha enviado!",
        status: "success",
      });
    } catch (error) {
      await recordFailedAttemptFirestore(`reset:${email}`);
      const errorMessage = handleErrorMessage(error as AuthError);
      showToast({
        title: "Error",
        description: errorMessage,
        status: "error",
      });
      setState((prevState) => ({
        ...prevState,
        error: errorMessage,
        loading: false,
        cancelled: false,
      }));
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        getIdToken(user).then((token) => {
          setState((prevState) => ({
            ...prevState,
            user: user,
            token: token,
          }));
        });
      } else {
        setState((prevState) => ({ ...prevState, user: null, token: null }));
      }
    });

    return () => {
      unsubscribe();
      setState((prevState) => ({ ...prevState, cancelled: true }));
    };
  }, []);

  return {
    auth,
    createUser,
    error: state.error,
    logout,
    login,
    loginWithGoogle,
    resetPassword,
    loading: state.loading,
    user: state.user,
    token: state.token,
  };
};
