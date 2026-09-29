// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { useState, useEffect } from "react";
import { X, Sparkles, Loader2, ShieldAlert, Send, Save, AlertTriangle } from "lucide-react";
import { api } from "../lib/api";

const inputCls = "w-full px-3 rounded-lg border border-line-strong bg-field text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-faint";

// Marcadores que deja el anonimizador automático y que conviene reescribir
const MARCADORES = /\[(usuario|correo|teléfono|IP)\]/gi;

/**
 * Editor de publicaciones del foro (solo admin).
 * `initial` puede ser una publicación existente (con id) o un borrador nuevo (con Ticket_ID opcional).
 */
export function ForoEditor({ initial, onClose, onSaved }) {
  const [form, setForm]         = useState({
    Titulo:    initial.Titulo ?? "",
    Categoria: initial.Categoria ?? "",
    Problema:  initial.Problema ?? "",
    Solucion:  initial.Solucion ?? "",
  });
  const [categorias, setCats]   = useState([]);
  const [saving, setSaving]     = useState(null); // "propuesta" | "publicado"
  const [aiLoading, setAi]      = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("/incidentes/categorias").then(setCats).catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const marcadores = [...new Set(`${form.Titulo} ${form.Problema} ${form.Solucion}`.match(MARCADORES) ?? [])];

  const redactarConIA = async () => {
    setAi(true); setError("");
    try {
      const r = await api.post(`/ai/tickets/${initial.Ticket_ID}/resumen-foro`);
      setForm(f => ({ ...f, Titulo: r.Titulo, Problema: r.Problema, Solucion: r.Solucion }));
    } catch (err) {
      setError(err.message);
    } finally {
      setAi(false);
    }
  };

  const guardar = async Estado => {
    setError("");
    if (!form.Titulo.trim() || !form.Problema.trim()) { setError("El título y el problema son obligatorios."); return; }
    if (Estado === "publicado" && !form.Solucion.trim()) { setError("Para publicar hace falta la solución."); return; }
    if (Estado === "publicado" && marcadores.length &&
        !confirm(`Aún quedan marcadores ${marcadores.join(", ")} en el texto. ¿Publicar de todos modos?`)) return;

    setSaving(Estado);
    try {
      const body = { ...form, Categoria: form.Categoria || null, Estado };
      const saved = initial.id
        ? await api.patch(`/foro/${initial.id}`, body)
        : await api.post("/foro", { ...body, Ticket_ID: initial.Ticket_ID ?? null });
      onSaved(saved);
    } catch (err) {
      setError(err.message);
      setSaving(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-2xl max-h-[92vh] bg-surface rounded-2xl border border-line shadow-2xl flex flex-col">
        <header className="px-6 py-4 border-b border-line flex items-center gap-3">
          <div className="flex-1">
            <h2 className="font-semibold text-ink">{initial.id ? "Editar publicación" : "Publicar en el foro"}</h2>
            <p className="text-xs text-muted mt-0.5">
              {initial.Ticket_ID ? `A partir del ticket TK-${String(initial.Ticket_ID).padStart(4, "0")} · ` : ""}
              {initial.propuesta_usuario ? "Propuesto por el usuario · " : ""}
              El caso se publica sin datos del usuario
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg border border-line-strong text-muted hover:bg-hover flex items-center justify-center">
            <X size={15} />
          </button>
        </header>

        <div className="px-6 py-5 overflow-y-auto thin-scroll flex flex-col gap-4">
          <div className="flex items-start gap-2.5 text-sm rounded-xl px-3.5 py-3 bg-warning/10 border border-warning/25 text-ink-2">
            <ShieldAlert size={18} className="text-warning flex-shrink-0 mt-0.5" />
            <p>
              <b>Anonimato:</b> ya quitamos automáticamente nombres, correos y teléfonos. Revisa que no queden datos que
              identifiquen a la persona (nombre, puesto, oficina exacta, fechas…).
            </p>
          </div>

          {initial.Ticket_ID && (
            <button
              onClick={redactarConIA} disabled={aiLoading}
              className="self-start h-9 px-3 rounded-lg border border-[#7c3aed]/40 text-sm font-semibold text-[#7c3aed] dark:text-[#a78bfa] hover:bg-[#7c3aed]/10 inline-flex items-center gap-1.5 disabled:opacity-60"
            >
              {aiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {aiLoading ? "Redactando…" : "Redactar con IA a partir del ticket"}
            </button>
          )}

          <div className="grid sm:grid-cols-[1fr_200px] gap-3">
            <div>
              <label className="text-xs font-semibold text-ink-2 block mb-1.5">Título</label>
              <input value={form.Titulo} onChange={e => set("Titulo", e.target.value)} maxLength={191}
                placeholder="Describe el síntoma: «La impresora no imprime y marca atasco»" className={`${inputCls} h-10`} />
            </div>
            <div>
              <label className="text-xs font-semibold text-ink-2 block mb-1.5">Categoría</label>
              <input value={form.Categoria} onChange={e => set("Categoria", e.target.value)} list="foro-categorias"
                placeholder="Redes, Hardware…" className={`${inputCls} h-10`} />
              <datalist id="foro-categorias">{categorias.map(c => <option key={c} value={c} />)}</datalist>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-2 block mb-1.5">El problema</label>
            <textarea value={form.Problema} onChange={e => set("Problema", e.target.value)} rows={4}
              placeholder="Qué le pasaba a la persona, en tercera persona." className={`${inputCls} py-2.5 resize-y leading-relaxed`} />
          </div>

          <div>
            <label className="text-xs font-semibold text-ink-2 block mb-1.5">La solución</label>
            <textarea value={form.Solucion} onChange={e => set("Solucion", e.target.value)} rows={7}
              placeholder={"1. Primer paso…\n2. Segundo paso…\n3. Si no funciona, reporta un problema."} className={`${inputCls} py-2.5 resize-y leading-relaxed`} />
          </div>

          {marcadores.length > 0 && (
            <p className="text-xs text-warning flex items-center gap-1.5">
              <AlertTriangle size={13} /> Quedan marcadores {marcadores.join(", ")}: reescribe esas frases de forma impersonal.
            </p>
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>

        <footer className="px-6 py-4 border-t border-line flex flex-wrap items-center justify-end gap-2">
          <button onClick={onClose} className="h-9 px-3.5 rounded-lg border border-line-strong text-sm font-semibold text-ink-2 hover:bg-hover">
            Cancelar
          </button>
          {initial.Estado !== "publicado" && (
            <button onClick={() => guardar(initial.Estado === "oculto" ? "oculto" : "propuesta")} disabled={!!saving}
              className="h-9 px-3.5 rounded-lg border border-line-strong text-sm font-semibold text-ink-2 hover:bg-hover inline-flex items-center gap-1.5 disabled:opacity-60">
              {saving && saving !== "publicado" ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Guardar sin publicar
            </button>
          )}
          <button onClick={() => guardar("publicado")} disabled={!!saving}
            className="h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-60">
            {saving === "publicado" ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {initial.Estado === "publicado" ? "Guardar cambios" : "Publicar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
