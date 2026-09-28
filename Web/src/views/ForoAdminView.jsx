import { useState, useEffect, useCallback } from "react";
import { Plus, RefreshCw, Pencil, Eye, EyeOff, Trash2, Send, ThumbsUp, MessageSquare, UserRound, Loader2, BookOpenCheck } from "lucide-react";
import { api } from "../lib/api";
import { ForoEditor } from "../foro/ForoEditor";
import { ForoBrowser, fechaCorta } from "../foro/ForoBrowser";
import { Michi } from "../components/ui/Michi";

const TABS = [
  { key: "propuesta", label: "Por revisar" },
  { key: "publicado", label: "Publicadas" },
  { key: "oculto",    label: "Ocultas" },
];

const ESTADO_PILL = {
  propuesta: "bg-warning/15 text-warning",
  publicado: "bg-success/15 text-success",
  oculto:    "bg-subtle text-muted border border-line",
};

// Gestión del foro (admin): revisar propuestas, publicar, ocultar y editar
export function ForoAdminView() {
  const [items, setItems]     = useState(null);
  const [tab, setTab]         = useState("propuesta");
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(false);
  const [error, setError]     = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setItems(await api.get("/foro/admin/todas"));
    } catch (err) {
      setError(err.message);
      setItems([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const cambiarEstado = async (p, Estado) => {
    try {
      await api.patch(`/foro/${p.id}`, { Estado });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const eliminar = async p => {
    if (!confirm(`¿Eliminar "${p.Titulo}" del foro? Se borrarán también sus votos y comentarios.`)) return;
    try {
      await api.delete(`/foro/${p.id}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (preview) {
    return (
      <div>
        <button onClick={() => setPreview(false)} className="mb-4 text-sm text-brand font-semibold hover:underline">← Volver a la gestión del foro</button>
        <ForoBrowser />
      </div>
    );
  }

  const counts = Object.fromEntries(TABS.map(t => [t.key, (items ?? []).filter(p => p.Estado === t.key).length]));
  const list = (items ?? []).filter(p => p.Estado === tab);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px]">
          <h1 className="text-xl font-semibold text-ink tracking-tight">Foro de soluciones</h1>
          <p className="text-sm text-muted mt-0.5">
            Publica casos resueltos de forma anónima. Desde un ticket finalizado usa <b>Publicar en el foro</b>.
          </p>
        </div>
        <button onClick={() => setPreview(true)} className="h-9 px-3 rounded-lg border border-line-strong bg-surface text-sm font-semibold text-ink-2 hover:bg-hover inline-flex items-center gap-1.5">
          <BookOpenCheck size={15} /> Ver como usuario
        </button>
        <button onClick={load} title="Recargar" className="w-9 h-9 rounded-lg border border-line-strong bg-surface text-muted hover:bg-hover flex items-center justify-center">
          <RefreshCw size={15} />
        </button>
        <button onClick={() => setEditing({})} className="h-9 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5">
          <Plus size={16} /> Nueva publicación
        </button>
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-surface border border-line self-start">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`h-8 px-3 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 ${tab === t.key ? "bg-brand-soft text-brand" : "text-muted hover:text-ink"}`}>
            {t.label}
            <span className={`text-[11px] px-1.5 rounded-full ${
              t.key === "propuesta" && counts.propuesta > 0 ? "bg-warning text-white" : tab === t.key ? "bg-brand text-white" : "bg-subtle text-muted"
            }`}>{counts[t.key]}</span>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="bg-surface rounded-xl border border-line overflow-hidden">
        {items === null ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-faint" /></div>
        ) : list.length === 0 ? (
          <div className="py-12 text-center">
            <Michi pose="sleep" size={104} className="mx-auto mb-2" />
            <p className="text-sm text-muted">
              {tab === "propuesta" ? "No hay casos pendientes de revisar." : tab === "publicado" ? "Aún no hay publicaciones." : "No hay publicaciones ocultas."}
            </p>
          </div>
        ) : list.map(p => (
          <div key={p.id} className="px-5 py-4 border-b border-line last:border-none flex items-start gap-4 hover:bg-hover/50">
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => setEditing(p)} className="font-semibold text-ink hover:text-brand text-left">{p.Titulo}</button>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded capitalize ${ESTADO_PILL[p.Estado]}`}>{p.Estado}</span>
                {p.propuesta_usuario ? (
                  <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-brand-soft text-brand inline-flex items-center gap-1">
                    <UserRound size={11} /> Propuesto por un usuario
                  </span>
                ) : null}
              </div>
              <p className="text-sm text-muted line-clamp-1 mt-0.5">{p.Problema}</p>
              <p className="text-xs text-faint mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                {p.Categoria && <span>{p.Categoria}</span>}
                {p.Ticket_ID && <span className="font-mono">TK-{String(p.Ticket_ID).padStart(4, "0")}</span>}
                <span>{fechaCorta(p.published_at ?? p.created_at)}</span>
                {p.Estado === "publicado" && <>
                  <span className="inline-flex items-center gap-1"><Eye size={12} /> {p.Vistas}</span>
                  <span className="inline-flex items-center gap-1"><ThumbsUp size={12} /> {p.util_si}</span>
                  <span className="inline-flex items-center gap-1"><MessageSquare size={12} /> {p.comentarios}</span>
                </>}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {p.Estado === "propuesta" && (
                <button onClick={() => setEditing(p)} className="h-8 px-3 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold inline-flex items-center gap-1.5">
                  <Send size={13} /> Revisar y publicar
                </button>
              )}
              {p.Estado === "publicado" && (
                <IconBtn title="Ocultar del foro" onClick={() => cambiarEstado(p, "oculto")}><EyeOff size={14} /></IconBtn>
              )}
              {p.Estado === "oculto" && (
                <IconBtn title="Volver a publicar" onClick={() => cambiarEstado(p, "publicado")}><Eye size={14} /></IconBtn>
              )}
              <IconBtn title="Editar" onClick={() => setEditing(p)}><Pencil size={14} /></IconBtn>
              <IconBtn title="Eliminar" danger onClick={() => eliminar(p)}><Trash2 size={14} /></IconBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <ForoEditor
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={saved => { setEditing(null); setTab(saved.Estado); load(); }}
        />
      )}
    </div>
  );
}

function IconBtn({ children, title, onClick, danger }) {
  return (
    <button onClick={onClick} title={title}
      className={`w-8 h-8 rounded-lg border border-line-strong flex items-center justify-center transition-colors ${
        danger ? "text-muted hover:text-danger hover:border-danger/40 hover:bg-danger/10" : "text-muted hover:bg-hover"
      }`}>
      {children}
    </button>
  );
}
