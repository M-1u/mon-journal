// Entry images are stored as { name, caption }. Older entries stored plain
// filename strings — normalize both shapes so the UI can rely on objects.
export function normImages(images) {
  return (images || []).map((im) =>
    typeof im === "string"
      ? { name: im, caption: "" }
      : { name: im.name, caption: im.caption || "" }
  );
}
