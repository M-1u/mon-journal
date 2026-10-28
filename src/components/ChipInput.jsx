import { useRef, useState } from "react";
import { IconClose } from "./Icons.jsx";

// Small tag-style input: type a label, press Enter (or comma) to add it as a
// chip; Backspace on an empty field removes the last one. Used for tags (#) and
// people (@). Values are plain strings; `prefix` is only for display.
export default function ChipInput({ values, onChange, prefix = "", placeholder, suggestions = [], listId, ariaLabel }) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef(null);

  function add(raw) {
    const s = String(raw || "").replace(/^[#@]+/, "").trim();
    if (!s) return;
    if (!values.some((v) => v.toLowerCase() === s.toLowerCase())) onChange([...values, s]);
    setDraft("");
  }
  function remove(i) {
    onChange(values.filter((_, idx) => idx !== i));
  }
  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      remove(values.length - 1);
    }
  }

  return (
    <div className="chip-input" onClick={() => inputRef.current?.focus()}>
      {values.map((v, i) => (
        <span className="chip" key={v + i}>
          {prefix}{v}
          <button type="button" onClick={(e) => { e.stopPropagation(); remove(i); }} aria-label="×">
            <IconClose width={11} height={11} />
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        className="chip-draft"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={values.length ? "" : placeholder}
        aria-label={ariaLabel}
        list={listId}
      />
      {suggestions.length ? (
        <datalist id={listId}>
          {suggestions.map((s) => <option key={s} value={s} />)}
        </datalist>
      ) : null}
    </div>
  );
}
