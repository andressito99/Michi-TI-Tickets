import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ThumbsUp, ThumbsDown, Loader2, CheckCircle2, CircleHelp, Send, Trash2, EyeOff, ShieldCheck, Eye, Plus } from "lucide-react";
import { api } from "../lib/api";
import { Avatar } from "../components/ui/Avatar";

const fecha = iso => iso
  ? new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })
  : "";

export function ForoPost({ id, onBack, onReport }) {
  const [post, setPost]         = useState(null);
  const [error, setError]       = useState("");
  const [comentario, setCom]    = useState("");
  const [anonimo, setAnonimo]   = useState(true);
  const [sending, setSending]   = useState(false);
  const [voting, setVoting]     = useState(false);

  const load = useCallback(async () => {
    try {
      setPost(await api.get(`/foro/${id}`));
    } catch (err) {
      setError(err.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const votar = async util => {
    setVoting(true);
    try {
      const r = await api.post(`/foro/${id}/voto`, { util });
      setPost(p => ({ ...p, util_si: r.util_si, util_no: r.util_no, mi_voto: util }));
    } catch (err) {
      setError(err.message);
    } finally {
      setVoting(false);
    }
  };

  const comentar = async () => {
    const msg = comentario.trim();
    if (!msg) return;
    setSending(true); setError("");
    try {
      await api.post(`/foro/${id}/comentarios`, { mensaje: msg, anonimo });
      setCom("");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const borrar = async cid => {
    if (!confirm("¿Borrar este comentario?")) return;
    try {
      await api.delete(`/foro/comentarios/${cid}`);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!post) {
    return error
      ? <div><BackLink onBack={onBack} /><p className="text-sm text-danger">{error}</p></div>
      : <div className="flex justify-center py-16"><Loader2 className="animate-spin text-faint" /></div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <BackLink onBack={onBack} />

      <article className="bg-surface rounded-2xl border border-line overflow-hidden">
        <header className="p-6 border-b border-line">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/15 text-success font-semibold">
              <CheckCircle2 size={12} /> Solucionado
            </span>
            {post.Categoria && <span className="px-2 py-0.5 rounded-md bg-subtle border border-line text-muted font-medium">{post.Categoria}</span>}
          </div>
          <h1 className="text-2xl font-semibold text-ink tracking-tight mt-3">{post.Titulo}</h1>
          <p className="text-sm text-faint mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> Caso anónimo publicado por el equipo de soporte</span>
            <span>{fecha(post.published_at)}</span>
            <span className="inline-flex items-center gap-1"><Eye size={13} /> {post.Vistas} vistas</span>
          </p>
        </header>

        <section className="p-6 border-b border-line">
          <h2 className="text-sm font-bold text-ink-2 uppercase tracking-wider flex items-center gap-2 mb-2">
            <CircleHelp size={16} className="text-warning" /> El problema
          </h2>
          <p className="text-ink-2 leading-relaxed whitespace-pre-wrap">{post.Problema}</p>
        </section>

        <section className="p-6 bg-success/5">
          <h2 className="text-sm font-bold text-success uppercase tracking-wider flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} /> La solución
          </h2>
          <p className="text-ink leading-relaxed whitespace-pre-wrap">{post.Solucion}</p>
        </section>

        <footer className="px-6 py-4 border-t border-line flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-ink-2">¿Te sirvió esta solución?</span>
          <VoteButton active={post.mi_voto === true} disabled={voting} onClick={() => votar(true)} Icon={ThumbsUp} label="Sí" count={post.util_si} tone="success" />
          <VoteButton active={post.mi_voto === false} disabled={voting} onClick={() => votar(false)} Icon={ThumbsDown} label="No" count={post.util_no} tone="danger" />
          {post.mi_voto === false && onReport && (
            <button onClick={onReport} className="ml-auto h-9 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5">
              <Plus size={15} /> Reportar mi problema
            </button>
          )}
        </footer>
      </article>

      {/* Comentarios */}
      <section className="bg-surface rounded-2xl border border-line p-6">
        <h2 className="font-semibold text-ink mb-4">Comentarios <span className="text-faint font-normal">({post.comentarios.length})</span></h2>

        <div className="flex flex-col gap-4">
          {post.comentarios.length === 0 && (
            <p className="text-sm text-muted">Nadie ha comentado todavía. ¿Te funcionó? ¡Cuéntalo!</p>
          )}
          {post.comentarios.map(c => (
            <div key={c.id} className="flex gap-3">
              {c.autor
                ? <Avatar name={c.autor} size="md" />
                : <span className="w-8 h-8 rounded-full bg-subtle border border-line flex items-center justify-center text-faint flex-shrink-0"><EyeOff size={14} /></span>}
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  <span className="font-semibold text-ink">{c.autor ?? "Anónimo"}</span>
                  {c.soporte && <span className="ml-1.5 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-brand-soft text-brand">Soporte</span>}
                  {c.mio && <span className="ml-1.5 text-[11px] text-faint">(tú)</span>}
                  <span className="text-xs text-faint ml-2">{fecha(c.created_at)}</span>
                </p>
                <p className="text-sm text-ink-2 mt-0.5 whitespace-pre-wrap">{c.mensaje}</p>
              </div>
              {c.mio && (
                <button onClick={() => borrar(c.id)} title="Borrar" className="w-8 h-8 rounded-lg text-faint hover:text-danger hover:bg-danger/10 flex items-center justify-center">
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-5 pt-5 border-t border-line">
          <textarea
            value={comentario} onChange={e => setCom(e.target.value)} rows={3}
            placeholder="¿Te funcionó? ¿Encontraste otra forma de resolverlo?"
            className="w-full px-3 py-2.5 rounded-xl border border-line-strong bg-field text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-faint resize-none"
          />
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <label className="inline-flex items-center gap-2 text-sm text-ink-2 cursor-pointer select-none">
              <input type="checkbox" checked={anonimo} onChange={e => setAnonimo(e.target.checked)} className="w-4 h-4 accent-[#1f6fe5]" />
              Comentar de forma anónima
            </label>
            {error && <span className="text-xs text-danger">{error}</span>}
            <button
              onClick={comentar} disabled={!comentario.trim() || sending}
              className="ml-auto h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />} Comentar
            </button>
          </div>
          <p className="text-xs text-faint mt-2">
            {anonimo ? "Nadie verá tu nombre. Evita escribir datos personales." : "Tu nombre será visible para todos."}
          </p>
        </div>
      </section>
    </div>
  );
}

function BackLink({ onBack }) {
  return (
    <button onClick={onBack} className="self-start text-sm text-muted hover:text-ink flex items-center gap-1.5">
      <ArrowLeft size={15} /> Foro de soluciones
    </button>
  );
}

function VoteButton({ active, disabled, onClick, Icon, label, count, tone }) {
  const on = tone === "success" ? "bg-success text-white border-success" : "bg-danger text-white border-danger";
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`h-9 px-3 rounded-lg border text-sm font-semibold inline-flex items-center gap-1.5 transition-colors disabled:opacity-60 ${
        active ? on : "border-line-strong text-ink-2 hover:bg-hover"
      }`}
    >
      <Icon size={15} /> {label} <span className="opacity-75">{count}</span>
    </button>
  );
}
