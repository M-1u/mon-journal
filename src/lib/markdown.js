import { marked } from "marked";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

marked.setOptions({ breaks: true, gfm: true });

const NBSP = "\u00A0"; // non-breaking space: survives both marked and turndown

const turndown = new TurndownService({
  headingStyle: "atx", // # Heading
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
  emDelimiter: "*",
  strongDelimiter: "**",
  // Keep intentionally-empty paragraphs (blank lines the user typed) as a line
  // holding a non-breaking space, so paragraphs don't get stuck together.
  blankReplacement: (content, node) =>
    node.nodeName === "P" ? `\n\n${NBSP}\n\n` : node.isBlock ? "\n\n" : "",
});
turndown.use(gfm);

// Markdown (stored) -> HTML (for the rich editor / read view).
export function mdToHtml(md) {
  return marked.parse(md || "");
}

// HTML (from the rich editor) -> Markdown (for storage).
export function htmlToMd(html) {
  // Normalize empty paragraphs (TipTap emits <p><br></p>) so they become blank
  // lines instead of being dropped.
  const normalized = (html || "").replace(
    /<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi,
    `<p>${NBSP}</p>`
  );
  return turndown
    .turndown(normalized)
    .replace(/\n{3,}/g, "\n\n") // collapse runaway blank lines
    .trim();
}
