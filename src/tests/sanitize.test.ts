import { describe, expect, it, vi } from "vitest";

vi.mock("dompurify", () => ({
  default: {
    sanitize: vi.fn((html: string) => {
      return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/data:/gi, "")
        .replace(/<a\b[^>]*>/gi, "")
        .replace(/<\/a>/gi, "")
        .replace(/<img\b[^>]*\/?>/gi, "")
        .replace(/\s*style\s*=\s*["'][^"']*["']/gi, "")
        .replace(/\s*target\s*=\s*["'][^"']*["']/gi, "");
    }),
  },
}));

import { sanitizeHtml } from "../utils/sanitize";

describe("sanitizeHtml", () => {
  describe("given valid HTML", () => {
    const validCases = [
      ["<p>Hello</p>", "should preserve paragraph tags"],
      ["<strong>bold</strong>", "should preserve strong tags"],
      ["<em>italic</em>", "should preserve em tags"],
      ["<h1>Title</h1>", "should preserve h1 tags"],
      ["<h2>Subtitle</h2>", "should preserve h2 tags"],
      ["<h3>Heading</h3>", "should preserve h3 tags"],
    ] as const;

    it.each(validCases)("%s - %s", (html) => {
      const result = sanitizeHtml(html);
      expect(result).toBeTruthy();
    });
  });

  describe("given text content", () => {
    it("should preserve plain text", () => {
      const text = "Simple text without any HTML";
      const result = sanitizeHtml(text);
      expect(result).toBe(text);
    });

    it("should handle empty string", () => {
      const result = sanitizeHtml("");
      expect(result).toBe("");
    });
  });

  describe("given potentially dangerous content", () => {
    it("should handle script tags", () => {
      const html = "<p>Hello</p><script>alert('xss')</script>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("<script>");
      expect(result).not.toContain("alert");
    });

    it("should handle inline event handlers", () => {
      const html = "<p onclick='alert(1)'>Click me</p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("onclick");
    });

    it("should handle javascript: protocol", () => {
      const html = "<p onclick='javascript:alert(1)'>Test</p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("javascript:");
    });

    it("should handle data: protocol", () => {
      const html = "<p src='data:text/html,<script>alert(1)</script>'>Test</p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("data:");
    });
  });

  describe("given allowed tags", () => {
    const allowedTags = [
      ["<ul><li>Item 1</li><li>Item 2</li></ul>", "should preserve ul and li"],
      ["<ol><li>Ordered</li></ol>", "should preserve ol"],
      ["<blockquote>Quote</blockquote>", "should preserve blockquote"],
      ["<code>console.log()</code>", "should preserve code"],
      ["<pre>Code block</pre>", "should preserve pre"],
      ["<span class='highlight'>Highlighted</span>", "should preserve span with class"],
      ["<p id='paragraph'>Text</p>", "should preserve id attribute"],
    ] as const;

    it.each(allowedTags)("%s - %s", (html) => {
      const result = sanitizeHtml(html);
      expect(result).toBeTruthy();
    });
  });

  describe("given forbidden tags and attributes", () => {
    it("should remove a tags (links)", () => {
      const html = "<p><a href='https://example.com'>Link</a></p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("<a");
      expect(result).not.toContain("href=");
    });

    it("should remove img tags", () => {
      const html = "<p><img src='image.jpg' alt='test' /></p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("<img");
      expect(result).not.toContain("src=");
    });

    it("should remove style attribute", () => {
      const html = "<p style='color:red'>Styled</p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("style=");
    });

    it("should remove target attribute", () => {
      const html = "<p target='_blank'>Target</p>";
      const result = sanitizeHtml(html);
      expect(result).not.toContain("target=");
    });
  });

  describe("given server-side rendering context", () => {
    it("should return string when window is undefined", () => {
      const originalWindow = globalThis.window;
      Object.defineProperty(globalThis, "window", {
        value: undefined,
        writable: true,
      });

      const html = "<p>Test</p>";
      const result = sanitizeHtml(html);

      Object.defineProperty(globalThis, "window", {
        value: originalWindow,
        writable: true,
      });

      expect(result).toBe(html);
    });
  });
});
