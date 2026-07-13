import { useRef } from "react";
import { storage } from "../lib/storage.js";
import { t } from "../lib/i18n.js";
import { IconPlus, IconClose } from "./Icons.jsx";

// Editable grid of photos for an entry. Each photo is { name, caption }.
export default function PhotoStrip({ images, onChange }) {
  const inputRef = useRef(null);

  function append(names) {
    onChange([...images, ...names.map((name) => ({ name, caption: "" }))]);
  }

  async function addFromInput(e) {
    const files = e.target.files;
    if (!files?.length) return;
    const names = await storage.addImageFiles(files);
    append(names);
    e.target.value = "";
  }

  async function addNative() {
    // In Electron, prefer the native picker (copies into the journal folder).
    if (storage.pickImages && window.journalAPI?.isElectron) {
      const names = await storage.pickImages();
      if (names.length) append(names);
    } else {
      inputRef.current?.click();
    }
  }

  function remove(idx) {
    onChange(images.filter((_, i) => i !== idx));
  }

  function setCaption(idx, caption) {
    onChange(images.map((im, i) => (i === idx ? { ...im, caption } : im)));
  }

  return (
    <div className="photo-strip">
      {images.map((im, idx) => (
        <div className="photo-card" key={im.name + idx}>
          <div className="photo">
            <img src={storage.imageUrl(im.name)} alt={im.caption || ""} />
            <button className="rm" onClick={() => remove(idx)} title={t("common.remove")}>
              <IconClose width={14} height={14} />
            </button>
          </div>
          <input
            className="photo-caption"
            placeholder={t("photo.caption")}
            value={im.caption}
            onChange={(e) => setCaption(idx, e.target.value)}
          />
        </div>
      ))}
      <button className="add-photo" onClick={addNative}>
        <IconPlus />
        {t("common.add")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={addFromInput}
      />
    </div>
  );
}
