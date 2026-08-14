/**
 * upload.js — file → data URL helpers for the prototype
 * TODO: Replace with Supabase Storage upload when connecting.
 */

const ALLOWED = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_BYTES = 5 * 1024 * 1024;

export function validateFile(file) {
  if (!file) return "No file selected";
  if (file.size > MAX_BYTES) {
    return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 5MB.`;
  }
  // Allow by extension if mime is empty (some browsers)
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const okExt = ["pdf", "jpg", "jpeg", "png", "webp", "doc", "docx"].includes(ext);
  if (file.type && !ALLOWED.includes(file.type) && !okExt) {
    return "Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX";
  }
  if (!file.type && !okExt) {
    return "Allowed types: PDF, JPG, PNG, WEBP, DOC, DOCX";
  }
  return "";
}

export function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export async function prepareUpload(file) {
  const err = validateFile(file);
  if (err) return { error: err, payload: null };
  const data_url = await fileToDataUrl(file);
  return {
    error: null,
    payload: {
      file_name: file.name,
      mime_type: file.type || "application/octet-stream",
      data_url,
      size: file.size,
    },
  };
}

export function bindDropzone(zone, onFiles) {
  if (!zone) return;
  const input = zone.querySelector('input[type="file"]');
  zone.addEventListener("click", () => input?.click());
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    zone.classList.add("is-dragover");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("is-dragover"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("is-dragover");
    if (e.dataTransfer?.files?.length) onFiles([...e.dataTransfer.files]);
  });
  input?.addEventListener("change", () => {
    if (input.files?.length) onFiles([...input.files]);
    input.value = "";
  });
}