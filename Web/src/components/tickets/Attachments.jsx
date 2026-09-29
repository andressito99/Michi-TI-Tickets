// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Capturas adjuntas: borrador (adjuntar, arrastrar o pegar con Ctrl+V), galería y visor.
import { useState, useEffect, useRef, useCallback } from "react";
import { Paperclip, X, Download, ChevronLeft, ChevronRight, ImageOff, Loader2 } from "lucide-react";
import { api } from "../../lib/api";

export const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
export const MAX_FILES = 5;
export const MAX_MB = 5;

const formatSize = bytes =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// Las capturas pegadas llegan como "image.png": se les da un nombre con fecha y hora
function friendlyName(file) {
  if (file.name && file.name !== "image.png") return file;
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const name = `captura-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.${ext}`;
  return new File([file], name, { type: file.type });
}

/**
 * Estado de las imágenes que el usuario está preparando para enviar.
 * Devuelve también los manejadores para pegar (Ctrl+V) y arrastrar y soltar.
 */
export function useImageDraft() {
  const [items, setItems]     = useState([]); // { id, file, url }
  const [error, setError]     = useState("");
  const [dragging, setDragging] = useState(false);
  const itemsRef = useRef(items);
  useEffect(() => { itemsRef.current = items; }, [items]);
  // Libera las vistas previas al desmontar
  useEffect(() => () => itemsRef.current.forEach(i => URL.revokeObjectURL(i.url)), []);

  const add = useCallback(list => {
    const next = [...itemsRef.current];
    let err = "";
    for (const raw of Array.from(list ?? [])) {
      if (!ACCEPTED_TYPES.includes(raw.type)) { err = `«${raw.name}» no es una imagen (PNG, JPG, GIF o WebP)`; continue; }
      if (raw.size > MAX_MB * 1024 * 1024)   { err = `«${raw.name}» pesa más de ${MAX_MB} MB`; continue; }
      if (next.length >= MAX_FILES)          { err = `Puedes adjuntar como máximo ${MAX_FILES} imágenes`; break; }
      const file = friendlyName(raw);
      next.push({ id: `${Date.now()}-${Math.random()}`, file, url: URL.createObjectURL(file) });
    }
    setItems(next);
    setError(err);
  }, []);

  const remove = useCallback(id => {
    setItems(prev => {
      const it = prev.find(i => i.id === id);
      if (it) URL.revokeObjectURL(it.url);
      return prev.filter(i => i.id !== id);
    });
    setError("");
  }, []);

  const clear = useCallback(() => {
    itemsRef.current.forEach(i => URL.revokeObjectURL(i.url));
    setItems([]);
    setError("");
  }, []);

  // Pegar: solo se capturan las imágenes; el texto se pega con normalidad
  const onPaste = useCallback(e => {
    const files = Array.from(e.clipboardData?.files ?? []).filter(f => f.type.startsWith("image/"));
    if (files.length) add(files);
  }, [add]);

  const dropProps = {
    onDragOver:  e => { if (e.dataTransfer?.types?.includes("Files")) { e.preventDefault(); setDragging(true); } },
    onDragLeave: e => { if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false); },
    onDrop:      e => { if (e.dataTransfer?.files?.length) { e.preventDefault(); add(e.dataTransfer.files); } setDragging(false); },
  };

  return { items, files: items.map(i => i.file), add, remove, clear, error, onPaste, dropProps, dragging };
}

/** Botón "Adjuntar captura" (abre el selector de archivos). */
export function AttachButton({ draft, disabled, compact = false }) {
  const inputRef = useRef(null);
  return (
    <>
      <input
        ref={inputRef} type="file" multiple hidden accept={ACCEPTED_TYPES.join(",")}
        onChange={e => { draft.add(e.target.files); e.target.value = ""; }}
      />
      <button
        type="button" disabled={disabled || draft.items.length >= MAX_FILES}
        onClick={() => inputRef.current?.click()}
        title="Adjuntar captura (también puedes pegarla con Ctrl+V o arrastrarla)"
        className={`h-8 rounded-lg text-xs font-semibold text-muted hover:text-ink hover:bg-hover inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors ${compact ? "w-8 justify-center" : "px-2.5"}`}
      >
        <Paperclip size={14} /> {!compact && "Adjuntar captura"}
      </button>
    </>
  );
}

/** Miniaturas de las imágenes preparadas (antes de enviar). */
export function DraftThumbs({ draft }) {
  if (draft.items.length === 0 && !draft.error) return null;
  return (
    <div className="px-3 pb-2">
      {draft.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {draft.items.map(it => (
            <div key={it.id} className="relative group" title={`${it.file.name} · ${formatSize(it.file.size)}`}>
              <img src={it.url} alt={it.file.name} className="w-16 h-16 rounded-lg object-cover border border-line" />
              <button
                type="button" onClick={() => draft.remove(it.id)} aria-label={`Quitar ${it.file.name}`}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink text-surface flex items-center justify-center shadow opacity-90 hover:opacity-100"
              >
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}
      {draft.error && <p className="text-xs text-danger mt-1.5">{draft.error}</p>}
    </div>
  );
}

// ── Imágenes guardadas ──────────────────────────────────────

// Caché en memoria: cada imagen se descarga una sola vez por sesión
const blobCache = new Map(); // id → Promise<objectURL>
function loadImage(id) {
  if (!blobCache.has(id)) {
    const p = api.blob(`/adjuntos/${id}`).then(blob => URL.createObjectURL(blob));
    p.catch(() => blobCache.delete(id));
    blobCache.set(id, p);
  }
  return blobCache.get(id);
}

/** Vacía la caché de imágenes (al cerrar sesión, para que otra persona no las vea). */
export function clearImageCache() {
  blobCache.forEach(p => p.then(url => URL.revokeObjectURL(url)).catch(() => {}));
  blobCache.clear();
}

function useImageUrl(id) {
  const [state, setState] = useState({ url: null, failed: false });
  useEffect(() => {
    let alive = true;
    loadImage(id)
      .then(url => alive && setState({ url, failed: false }))
      .catch(() => alive && setState({ url: null, failed: true }));
    return () => { alive = false; };
  }, [id]);
  return state;
}

function Thumb({ adjunto, size, onOpen }) {
  const { url, failed } = useImageUrl(adjunto.id);
  return (
    <button
      type="button" onClick={onOpen} title={`${adjunto.Nombre} · ${formatSize(adjunto.Tamano)}`}
      className="relative rounded-lg overflow-hidden border border-line bg-subtle hover:ring-2 hover:ring-brand/40 transition flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {url ? <img src={url} alt={adjunto.Nombre} className="w-full h-full object-cover" />
        : failed ? <ImageOff size={18} className="text-faint" />
        : <Loader2 size={16} className="animate-spin text-faint" />}
    </button>
  );
}

/** Miniaturas de las capturas de un mensaje o de un ticket; al pulsar se abre el visor. */
export function AttachmentGallery({ adjuntos = [], size = 88, className = "" }) {
  const [open, setOpen] = useState(null); // índice abierto en el visor
  if (!adjuntos.length) return null;
  return (
    <>
      <div className={`flex flex-wrap gap-2 ${className}`}>
        {adjuntos.map((a, i) => <Thumb key={a.id} adjunto={a} size={size} onOpen={() => setOpen(i)} />)}
      </div>
      {open != null && <Lightbox adjuntos={adjuntos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({ adjuntos, index, onIndex, onClose }) {
  const adj = adjuntos[index];
  const { url, failed } = useImageUrl(adj.id);
  const many = adjuntos.length > 1;
  const prev = useCallback(() => onIndex((index - 1 + adjuntos.length) % adjuntos.length), [index, adjuntos.length, onIndex]);
  const next = useCallback(() => onIndex((index + 1) % adjuntos.length), [index, adjuntos.length, onIndex]);

  useEffect(() => {
    const onKey = e => {
      if (e.key === "Escape") onClose();
      if (many && e.key === "ArrowLeft") prev();
      if (many && e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, prev, next, many]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 flex flex-col" onMouseDown={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={adj.Nombre}>
      <div className="flex items-center gap-3 px-4 py-3 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{adj.Nombre}</p>
          <p className="text-xs text-white/60">{formatSize(adj.Tamano)}{many ? ` · ${index + 1} de ${adjuntos.length}` : ""}</p>
        </div>
        {url && (
          <a href={url} download={adj.Nombre} className="h-9 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold inline-flex items-center gap-1.5">
            <Download size={15} /> Descargar
          </a>
        )}
        <button onClick={onClose} className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center" aria-label="Cerrar">
          <X size={18} />
        </button>
      </div>
      <div className="flex-1 min-h-0 flex items-center justify-center px-4 pb-6 gap-3" onMouseDown={e => e.target === e.currentTarget && onClose()}>
        {many && (
          <button onClick={prev} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0" aria-label="Anterior">
            <ChevronLeft size={22} />
          </button>
        )}
        {url ? <img src={url} alt={adj.Nombre} className="max-h-full max-w-full object-contain rounded-lg shadow-2xl" />
          : failed ? <p className="text-white/70 text-sm">No se pudo cargar la imagen.</p>
          : <Loader2 className="animate-spin text-white/70" />}
        {many && (
          <button onClick={next} className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center flex-shrink-0" aria-label="Siguiente">
            <ChevronRight size={22} />
          </button>
        )}
      </div>
    </div>
  );
}
