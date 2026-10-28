import { renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getIdToken: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signInWithPopup: vi.fn(),
}));

vi.mock("firebase/auth", () => ({
  GoogleAuthProvider: class {},
  createUserWithEmailAndPassword: vi.fn(),
  getIdToken: mocks.getIdToken,
  onAuthStateChanged: () => () => {},
  sendPasswordResetEmail: vi.fn(),
  signInWithEmailAndPassword: mocks.signInWithEmailAndPassword,
  signInWithPopup: mocks.signInWithPopup,
  signOut: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock("../firebase/config", () => ({ auth: {}, db: {} }));

vi.mock("../hooks/useToastNotification", () => ({
  useToastNotification: () => ({ showToast: vi.fn() }),
}));

import { useAuthentication } from "../hooks/useAuthentication";

describe("useAuthentication > login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given invalid credentials", () => {
    it("should reject so the login screen does not navigate away", async () => {
      mocks.signInWithEmailAndPassword.mockRejectedValue(
        Object.assign(new Error("Firebase: Error (auth/invalid-credential)."), {
          code: "auth/invalid-credential",
        })
      );

      const { result } = renderHook(() => useAuthentication());

      await expect(
        result.current.login({ email: "ninguem@example.com", password: "errada" })
      ).rejects.toThrow();
      expect(mocks.getIdToken).not.toHaveBeenCalled();
    });
  });

  describe("given valid credentials", () => {
    it("should resolve and expose the user and a fresh token", async () => {
      mocks.signInWithEmailAndPassword.mockResolvedValue({ user: { uid: "uid-1" } });
      mocks.getIdToken.mockResolvedValue("token-fresco");

      const { result } = renderHook(() => useAuthentication());

      await expect(
        result.current.login({ email: "autor@example.com", password: "Correta!2026" })
      ).resolves.toBeUndefined();

      await waitFor(() => {
        expect(result.current.user).toEqual({ uid: "uid-1" });
      });
      expect(result.current.token).toBe("token-fresco");
      // forceRefresh: o claim `author` pode ter mudado desde o último login.
      expect(mocks.getIdToken).toHaveBeenCalledWith({ uid: "uid-1" }, true);
    });
  });
});

describe("useAuthentication > loginWithGoogle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("given a popup failure", () => {
    it("should reject so the form can decide whether to show the error", async () => {
      mocks.signInWithPopup.mockRejectedValue(
        Object.assign(new Error("Firebase: Error (auth/popup-closed-by-user)."), {
          code: "auth/popup-closed-by-user",
        })
      );

      const { result } = renderHook(() => useAuthentication());

      await expect(result.current.loginWithGoogle()).rejects.toMatchObject({
        code: "auth/popup-closed-by-user",
      });
    });
  });
});
