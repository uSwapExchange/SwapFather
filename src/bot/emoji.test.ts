import { describe, expect, test } from "bun:test";
import { assetEmojiHtml } from "./emoji.ts";

describe("custom emoji HTML", () => {
  test("uses a real emoji as the entity placeholder", () => {
    for (const asset of ["btc", "eth", "sol", "xrp"]) {
      const html = assetEmojiHtml(asset);
      const placeholder = html.match(/<tg-emoji[^>]*>(.*?)<\/tg-emoji>/)?.[1];

      expect(placeholder).toBeDefined();
      expect(placeholder).toMatch(/\p{Extended_Pictographic}/u);
    }
  });
});
