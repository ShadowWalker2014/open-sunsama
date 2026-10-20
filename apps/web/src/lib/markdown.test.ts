import { describe, expect, it } from "vitest";
import { descriptionToHtml } from "./markdown";

describe("descriptionToHtml", () => {
  it("renders supported Markdown without passing through HTML", () => {
    const html = descriptionToHtml(
      "# Heading\n\n**bold** and *emphasis* with `code`.\n\n- one\n- [link](https://example.com)\n\n<script>alert(1)</script>"
    );

    expect(html).toContain("<h1>Heading</h1>");
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain("<code>code</code>");
    expect(html).toContain('<a href="https://example.com">link</a>');
    expect(html).toContain("<ul>");
    expect(html).not.toContain("<script>");
  });

  it("keeps existing rich-text HTML unchanged", () => {
    expect(descriptionToHtml("<p><strong>Existing</strong> note</p>")).toBe(
      "<p><strong>Existing</strong> note</p>"
    );
    expect(descriptionToHtml("<blockquote><p>Existing quote</p></blockquote>")).toBe(
      "<blockquote><p>Existing quote</p></blockquote>"
    );
  });
});
