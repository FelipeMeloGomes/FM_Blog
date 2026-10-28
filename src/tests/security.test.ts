import { describe, expect, it } from "vitest";
import { isCommonPassword, sanitizeInput, sanitizeTag } from "../utils/security";

describe("sanitizeTag", () => {
  describe("given normal tag input", () => {
    it("should lowercase and trim tags", () => {
      expect(sanitizeTag("  React  ")).toBe("react");
      expect(sanitizeTag("TYPESCRIPT")).toBe("typescript");
    });
  });

  describe("given potentially dangerous tag input", () => {
    const dangerousInputs = [
      ["<script>alert('xss')</script>", "script tags"],
      ["javascript:alert('xss')", "javascript protocol"],
      ["onclick=alert('xss')", "event handler"],
    ] as const;

    it.each(dangerousInputs)("should sanitize: %s (%s)", (input) => {
      const result = sanitizeTag(input);
      expect(result).not.toMatch(/<script|javascript:|onclick/i);
    });
  });

  describe("given tag length limits", () => {
    it("should truncate to 30 characters", () => {
      const longTag = "a".repeat(50);
      const result = sanitizeTag(longTag);
      expect(result).toHaveLength(30);
    });

    it("should preserve short tags as-is", () => {
      const shortTag = "react";
      const result = sanitizeTag(shortTag);
      expect(result).toBe(shortTag);
    });
  });
});

describe("sanitizeInput", () => {
  describe("given normal text input", () => {
    it("should trim whitespace", () => {
      expect(sanitizeInput("  hello  ")).toBe("hello");
    });

    it("should preserve normal text", () => {
      const text = "Hello World 123";
      expect(sanitizeInput(text)).toBe(text);
    });
  });

  describe("given dangerous input", () => {
    const dangerousInputs = [
      ["<script>", "script tag"],
      ["javascript:alert(1)", "javascript protocol"],
      ["<img onerror='alert(1)'>", "event handler in tag"],
    ] as const;

    it.each(dangerousInputs)("should sanitize: %s (%s)", (input) => {
      const result = sanitizeInput(input);
      expect(result).not.toMatch(/<script|javascript:|on\w+=/i);
    });
  });
});

describe("isCommonPassword", () => {
  describe("given common passwords", () => {
    const commonPasswords = [
      "password",
      "123456",
      "qwerty",
      "letmein",
      "welcome",
      "monkey",
      "dragon",
    ] as const;

    it.each(commonPasswords)("should return true for: %s", (password) => {
      expect(isCommonPassword(password)).toBe(true);
    });
  });

  describe("given case variations of common passwords", () => {
    it("should be case insensitive", () => {
      expect(isCommonPassword("PASSWORD")).toBe(true);
      expect(isCommonPassword("Password")).toBe(true);
      expect(isCommonPassword("PaSsWoRd")).toBe(true);
    });
  });

  describe("given secure passwords", () => {
    const securePasswords = [
      "MySecureP@ssw0rd!",
      "Xy7#kL9$mN",
      "C0mpl3x!Pass#123",
      "Str0ng&Secure$2024",
    ] as const;

    it.each(securePasswords)("should return false for: %s", (password) => {
      expect(isCommonPassword(password)).toBe(false);
    });
  });
});

