import { CONSTANTS } from "./constants";

const COMMON_PASSWORDS = [
  "password",
  "password1",
  "password1!",
  "123456",
  "12345678",
  "1234567",
  "123456789",
  "1234567890",
  "qwerty",
  "qwerty123",
  "abc123",
  "monkey",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "password123",
  "password12",
  "welcome",
  "welcome1",
  "admin",
  "login",
  "passw0rd",
  "hello",
  "charlie",
  "donald",
  "1234",
  "pass",
  "test",
  "guest",
];

export const sanitizeTag = (tag: string): string => {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[<>\"'&]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .slice(0, CONSTANTS.VALIDATION.TAG_MAX_LENGTH);
};

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
};

export const isCommonPassword = (password: string): boolean => {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
};

export interface RateLimitResult {
  allowed: boolean;
  remainingAttempts: number;
  waitSeconds: number;
}

export const filterRecentAttempts = (attempts: number[], now: number): number[] => {
  return attempts.filter(
    (timestamp) => now - timestamp < CONSTANTS.AUTH.RATE_LIMIT_WINDOW_MS
  );
};

export const evaluateRateLimit = (attempts: number[], now: number): RateLimitResult => {
  const recentAttempts = filterRecentAttempts(attempts, now);
  const maxAttempts = CONSTANTS.AUTH.RATE_LIMIT_MAX_ATTEMPTS;

  if (recentAttempts.length >= maxAttempts) {
    const oldestAttempt = Math.min(...recentAttempts);
    const waitMs = CONSTANTS.AUTH.RATE_LIMIT_WINDOW_MS - (now - oldestAttempt);

    return {
      allowed: false,
      remainingAttempts: 0,
      waitSeconds: Math.ceil(waitMs / 1000),
    };
  }

  return {
    allowed: true,
    remainingAttempts: maxAttempts - recentAttempts.length,
    waitSeconds: 0,
  };
};
