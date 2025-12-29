import { describe, expect, it } from "vitest";

import {
  parseMarkdownList,
  parseMarkdownTable,
  parseMessageContent,
} from "@/utils/message-parser";

describe("Message Parser", () => {
  describe("parseMarkdownTable", () => {
    it("should parse a valid markdown table", () => {
      const content = `
| Name | Status |
|------|--------|
| John | ACTIVE |
| Jane | INACTIVE |
      `.trim();

      const result = parseMarkdownTable(content);
      expect(result).not.toBeNull();
      expect(result?.headers).toEqual(["Name", "Status"]);
      expect(result?.rows).toEqual([
        ["John", "ACTIVE"],
        ["Jane", "INACTIVE"],
      ]);
    });

    it("should return null for invalid table", () => {
      const content = "Just some text";
      const result = parseMarkdownTable(content);
      expect(result).toBeNull();
    });
  });

  describe("parseMarkdownList", () => {
    it("should parse unordered list", () => {
      const content = `
- Item 1
- Item 2
- Item 3
      `.trim();

      const result = parseMarkdownList(content);
      expect(result).not.toBeNull();
      expect(result?.items).toEqual(["Item 1", "Item 2", "Item 3"]);
      expect(result?.ordered).toBe(false);
    });

    it("should parse ordered list", () => {
      const content = `
1. First
2. Second
3. Third
      `.trim();

      const result = parseMarkdownList(content);
      expect(result).not.toBeNull();
      expect(result?.items).toEqual(["First", "Second", "Third"]);
      expect(result?.ordered).toBe(true);
    });
  });

  describe("parseMessageContent", () => {
    it("should detect and parse table", () => {
      const content = `
| Name | Status |
|------|--------|
| Test | ACTIVE |
      `.trim();

      const result = parseMessageContent(content);
      expect(result.type).toBe("table");
      expect(typeof result.data).toBe("object");
    });

    it("should detect and parse list", () => {
      const content = "- Item 1\n- Item 2";
      const result = parseMessageContent(content);
      expect(result.type).toBe("list");
      expect(typeof result.data).toBe("object");
    });

    it("should default to text for plain content", () => {
      const content = "Just plain text";
      const result = parseMessageContent(content);
      expect(result.type).toBe("text");
      expect(result.data).toBe(content);
    });
  });
});
