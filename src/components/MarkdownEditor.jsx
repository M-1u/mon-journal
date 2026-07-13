import { useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import { mdToHtml, htmlToMd } from "../lib/markdown.js";
import { t } from "../lib/i18n.js";
import {
  IconBold,
  IconItalic,
  IconHeading,
  IconList,
  IconListOrdered,
  IconQuote,
  IconLink,
  IconCode,
} from "./Icons.jsx";

// A visual (WYSIWYG) editor: clicking "Bold" makes the text actually bold.
// Content is edited as rich text but stored as Markdown (via marked/turndown),
// so the journal files stay plain and readable.
export default function MarkdownEditor({ value, onChange, placeholder }) {
  // Markdown we last emitted upward — lets us ignore the echo of our own edits
  // when the `value` prop comes back, avoiding cursor jumps / loops.
  const lastEmitted = useRef(value || "");
  const [, force] = useState(0);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // we add Link explicitly below (avoids duplicate)
        heading: { levels: [1, 2, 3] },
      }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({
        placeholder: placeholder || t("md.placeholder"),
      }),
    ],
    content: mdToHtml(value),
    onUpdate: ({ editor }) => {
      const md = htmlToMd(editor.getHTML());
      lastEmitted.current = md;
      onChange(md);
    },
  });

  // Re-render the toolbar (active states) on every selection / content change.
  useEffect(() => {
    if (!editor) return;
    const rerender = () => force((n) => n + 1);
    editor.on("transaction", rerender);
    return () => editor.off("transaction", rerender);
  }, [editor]);

  // When the day (external value) changes, load it into the editor.
  useEffect(() => {
    if (!editor) return;
    if ((value || "") !== lastEmitted.current) {
      lastEmitted.current = value || "";
      editor.commands.setContent(mdToHtml(value), false);
    }
  }, [value, editor]);

  // Ctrl/Cmd+K opens the link bar.
  useEffect(() => {
    if (!editor) return;
    const dom = editor.view.dom;
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openLink();
      }
    };
    dom.addEventListener("keydown", onKey);
    return () => dom.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  if (!editor) return null;

  const is = (name, attrs) => editor.isActive(name, attrs);

  function applyLink() {
    const url = linkUrl.trim();
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    } else {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    }
    setLinkOpen(false);
    setLinkUrl("");
  }

  function openLink() {
    setLinkUrl(editor.getAttributes("link").href || "");
    setLinkOpen(true);
  }

  const Tool = ({ title, active, onClick, Icon }) => (
    <button
      type="button"
      className={"md-tool" + (active ? " active" : "")}
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
    >
      <Icon width={17} height={17} />
    </button>
  );

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        <div className="md-tools">
          <Tool title={t("md.bold")} Icon={IconBold} active={is("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()} />
          <Tool title={t("md.italic")} Icon={IconItalic} active={is("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()} />
          <Tool title={t("md.heading")} Icon={IconHeading} active={is("heading", { level: 2 })}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
          <span className="md-sep" />
          <Tool title={t("md.bullet")} Icon={IconList} active={is("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()} />
          <Tool title={t("md.ordered")} Icon={IconListOrdered} active={is("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()} />
          <Tool title={t("md.quote")} Icon={IconQuote} active={is("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()} />
          <span className="md-sep" />
          <Tool title={t("md.link")} Icon={IconLink} active={is("link")} onClick={openLink} />
          <Tool title={t("md.code")} Icon={IconCode} active={is("code")}
            onClick={() => editor.chain().focus().toggleCode().run()} />
        </div>
      </div>

      {linkOpen && (
        <div className="md-link-bar">
          <input
            autoFocus
            type="url"
            placeholder={t("md.linkPlaceholder")}
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); applyLink(); }
              if (e.key === "Escape") setLinkOpen(false);
            }}
          />
          <button className="btn primary" onClick={applyLink}>{t("md.apply")}</button>
          <button className="btn ghost" onClick={() => setLinkOpen(false)}>{t("common.cancel")}</button>
        </div>
      )}

      <EditorContent editor={editor} className="md-content" />
    </div>
  );
}
