import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({ breaks: true, gfm: true });

const turndown = new TurndownService({
  headingStyle: "atx", // # Heading
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
});
turndown.use(gfm);

// Markdown (stored) -> HTML (for the rich editor).
export function mdToHtml(md) {
  return marked.parse(md || "");
}

// HTML (from the rich editor) -> Markdown (for storage).
export function htmlToMd(html) {
  return turndown
    .turndown(html || "")
    .replace(/\n{3,}/g, "\n\n") // collapse extra blank lines
    .trim();
}
