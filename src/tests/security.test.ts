import { describe, expect, it } from "vitest";
import { CONSTANTS } from "../utils/constants";
import {
  evaluateRateLimit,
  filterRecentAttempts,
  isCommonPassword,
  sanitizeInput,
  sanitizeTag,
} from "../utils/security";

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

describe("evaluateRateLimit", () => {
  const now = 1_700_000_000_000;
  const maxAttempts = CONSTANTS.AUTH.RATE_LIMIT_MAX_ATTEMPTS;
  const windowMs = CONSTANTS.AUTH.RATE_LIMIT_WINDOW_MS;

  describe("given no previous attempts", () => {
    it("should allow the attempt with the full quota", () => {
      const result = evaluateRateLimit([], now);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(maxAttempts);
      expect(result.waitSeconds).toBe(0);
    });
  });

  describe("given previous attempts inside the window", () => {
    it("should decrement the remaining attempts", () => {
      const result = evaluateRateLimit([now - 1000], now);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(maxAttempts - 1);
    });
  });

  describe("given attempts at the limit", () => {
    it("should block the attempt and report a wait time", () => {
      const attempts = Array.from({ length: maxAttempts }, (_, i) => now - i * 1000);

      const result = evaluateRateLimit(attempts, now);

      expect(result.allowed).toBe(false);
      expect(result.remainingAttempts).toBe(0);
      expect(result.waitSeconds).toBeGreaterThan(0);
    });
  });

  describe("given attempts older than the window", () => {
    it("should ignore expired attempts", () => {
      const attempts = Array.from({ length: maxAttempts }, (_, i) => now - windowMs - 1000 - i);

      const result = evaluateRateLimit(attempts, now);

      expect(result.allowed).toBe(true);
      expect(result.remainingAttempts).toBe(maxAttempts);
    });
  });
});

describe("filterRecentAttempts", () => {
  const now = 1_700_000_000_000;
  const windowMs = CONSTANTS.AUTH.RATE_LIMIT_WINDOW_MS;

  it("should drop attempts that fell outside the window", () => {
    const recent = now - 1000;
    const expired = now - windowMs - 1;

    expect(filterRecentAttempts([recent, expired, recent - 500], now)).toEqual([recent, recent - 500]);
  });

  it("should return an empty list when every attempt expired", () => {
    expect(filterRecentAttempts([now - windowMs - 1], now)).toEqual([]);
  });
});
