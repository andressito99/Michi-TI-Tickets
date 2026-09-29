import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Check, Send, Loader2, Clock, UserRound, Info, Ban, BookOpenCheck, ShieldCheck, Heart } from "lucide-react";
import { api } from "../lib/api";
import { StatusBadge } from "../components/tickets/StatusBadge";
import { Avatar } from "../components/ui/Avatar";
import { useConversaciones } from "../hooks/useConversaciones";
import { categoryStyle } from "./categoryIcon";
import { Michi } from "../components/ui/Michi";
import { AttachButton, AttachmentGallery, DraftThumbs, useImageDraft } from "../components/tickets/Attachments";

const SYSTEM_PREFIX = "[Sistema]";
const isSystem = m => m.split(/\n\s*\n/).every(p => p.trim().startsWith(SYSTEM_PREFIX));
const systemLines = m => m.split(/\n\s*\n/).map(p => p.trim().replace(SYSTEM_PREFIX, "").trim());

const when = iso => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
  : "";

// Progreso visible para el usuario: Recibido → En proceso → Resuelto
function Progress({ status }) {
  const reached = status === "resolved" ? 3 : 2;
  const steps = ["Recibido", "En proceso", "Resuelto"];
  return (
    <ol className="flex items-center">
      {steps.map((label, i) => {
        const done = i < reached;
        return (
          <li key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span className={`w-7 h-7 rounded-full flex items-center justify-center ${done ? "bg-success text-white" : "bg-subtle border border-line-strong text-faint"}`}>
                {done ? <Check size={14} strokeWidth={3} /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <span className={`text-xs font-medium whitespace-nowrap ${done ? "text-ink" : "text-faint"}`}>{label}</span>
            </div>
            {i < steps.length - 1 && <span className={`flex-1 h-0.5 mx-2 mb-5 rounded ${i + 1 < reached ? "bg-success" : "bg-line"}`} />}
          </li>
        );
      })}
    </ol>
  );
}

// Invita al usuario a compartir su caso resuelto en el foro (el admin lo revisa y anonimiza)
function ShareToForo({ ticketId }) {
  const [estado, setEstado]   = useState(undefined); // undefined = cargando
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get(`/foro/ticket/${ticketId}/estado`).then(r => setEstado(r.estado)).catch(() => setEstado(null));
  }, [ticketId]);

  const proponer = async () => {
    setSending(true); setError("");
    try {
      const r = await api.post("/foro/proponer", { ticket_id: ticketId });
      setEstado(r.estado);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  if (estado === undefined || estado === "oculto") return null;

  if (estado === "publicado") {
    return (
      <section className="rounded-2xl border border-success/30 bg-success/5 p-4 flex items-center gap-3 text-sm">
        <Heart size={18} className="text-success flex-shrink-0" />
        <p className="text-ink-2"><b>¡Gracias!</b> Tu caso ya está publicado de forma anónima en el foro de soluciones y ayuda a otras personas.</p>
      </section>
    );
  }
  if (estado === "propuesta") {
    return (
      <section className="rounded-2xl border border-line bg-surface p-4 flex items-center gap-3 text-sm">
        <BookOpenCheck size={18} className="text-brand flex-shrink-0" />
        <p className="text-ink-2"><b>Caso enviado al foro.</b> El equipo de soporte lo revisará, quitará cualquier dato personal y lo publicará.</p>
      </section>
    );
  }
  return (
    <section className="rounded-2xl border border-success/30 bg-success/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <Michi pose="celebrate" size={84} className="flex-shrink-0 self-center" title="" />
      <div className="flex-1">
        <p className="font-semibold text-ink">¿Tu problema quedó resuelto? Ayuda a otros</p>
        <p className="text-sm text-muted mt-0.5 flex items-start gap-1.5">
          <ShieldCheck size={15} className="text-success flex-shrink-0 mt-0.5" />
          <span>
            Propón este caso para el foro de soluciones. Se publica de forma <b className="text-ink-2">anónima</b>: el equipo revisa el texto y quita tu nombre y cualquier dato personal.
          </span>
        </p>
        {error && <p className="text-xs text-danger mt-1">{error}</p>}
      </div>
      <button
        onClick={proponer} disabled={sending}
        className="h-10 px-4 rounded-lg bg-success hover:brightness-110 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 flex-shrink-0 disabled:opacity-60"
      >
        {sending ? <Loader2 size={15} className="animate-spin" /> : <BookOpenCheck size={15} />} Proponer para el foro
      </button>
    </section>
  );
}

function Bubble({ mine, author, date, children, adjuntos = [] }) {
  return (
    <div className={`flex gap-2.5 ${mine ? "flex-row-reverse" : ""}`}>
      {!mine && <Avatar name={author} size="md" />}
      <div className={`max-w-[80%] flex flex-col ${mine ? "items-end" : "items-start"}`}>
        <span className="text-xs text-faint mb-1 px-1">{mine ? "Tú" : `${author} · Soporte`} · {date}</span>
        <div className={`px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap rounded-2xl ${
          mine ? "bg-brand text-white rounded-tr-md" : "bg-surface border border-line text-ink-2 rounded-tl-md"
        }`}>
          {children}
        </div>
        <AttachmentGallery adjuntos={adjuntos} size={96} className={`mt-2 ${mine ? "justify-end" : ""}`} />
      </div>
    </div>
  );
}

export function TicketThread({ ticket, user, onBack, onChanged }) {
  const { conversaciones, adjuntosReporte, loading, addConversacion } = useConversaciones(ticket._id);
  const draft = useImageDraft(); // capturas preparadas para enviar
  const [text, setText]       = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError]     = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversaciones.length]);

  const send = async () => {
    const msg = text.trim();
    if ((!msg && draft.files.length === 0) || sending) return;
    setSending(true); setError("");
    const res = await addConversacion(msg, draft.files);
    setSending(false);
    if (res?.success) { setText(""); draft.clear(); onChanged(); }
    else setError(res?.error || "No se pudo enviar el mensaje");
  };

  const { Icon, tint } = categoryStyle(ticket.category);
  const assigned = ticket.agent && ticket.agent !== "Sin asignar";

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="self-start text-sm text-muted hover:text-ink flex items-center gap-1.5">
        <ArrowLeft size={15} /> Mis tickets
      </button>

      {/* Resumen del ticket */}
      <section className="bg-surface rounded-2xl border border-line p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${tint}`}><Icon size={22} /></span>
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2">
              <h1 className="text-xl font-semibold text-ink tracking-tight">{ticket.title}</h1>
              <span className="ml-auto pt-1"><StatusBadge status={ticket.status} /></span>
            </div>
            <p className="text-sm text-faint mt-0.5">{ticket.id} · {ticket.category} · creado el {when(ticket.rawFecha)}</p>
          </div>
        </div>

        <div className="mt-6"><Progress status={ticket.status} /></div>

        {ticket.status === "closed" && (
          <p className="mt-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 flex items-center gap-2">
            <Ban size={15} /> El equipo marcó este ticket como bloqueado. Revisa los mensajes o escríbenos si necesitas ayuda.
          </p>
        )}

        <div className="mt-5 pt-4 border-t border-line grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2.5">
            {assigned ? <Avatar name={ticket.agent} size="sm" /> : <UserRound size={18} className="text-faint" />}
            <span className="text-muted">Te atiende:</span>
            <span className="font-medium text-ink">{assigned ? ticket.agent : "Por asignar"}</span>
          </div>
          {ticket.incidenteTiempo && (
            <div className="flex items-center gap-2.5">
              <Clock size={18} className="text-faint" />
              <span className="text-muted">Solución estimada:</span>
              <span className="font-medium text-ink">{ticket.incidenteTiempo}</span>
            </div>
          )}
        </div>
      </section>

      {ticket.status === "resolved" && <ShareToForo ticketId={ticket._id} />}

      {/* Conversación */}
      <section className="bg-subtle rounded-2xl border border-line p-4 sm:p-6 flex flex-col gap-4">
        <Bubble mine author={user.name} date={when(ticket.rawFecha)} adjuntos={adjuntosReporte}>{ticket.desc || "Sin descripción."}</Bubble>

        {loading && conversaciones.length === 0 && (
          <div className="flex justify-center py-4"><Loader2 size={18} className="animate-spin text-faint" /></div>
        )}

        {conversaciones.map(c =>
          isSystem(c.mensaje) ? (
            systemLines(c.mensaje).map((line, i) => (
              <div key={`${c.id}-${i}`} className="flex justify-center">
                <span className="text-xs text-muted bg-surface border border-line rounded-full px-3 py-1 flex items-center gap-1.5">
                  <Info size={12} className="text-faint" /> {line} · {when(c.rawFecha)}
                </span>
              </div>
            ))
          ) : (
            <Bubble key={c.id} mine={c.usuarioId === user.id} author={c.usuario} date={when(c.rawFecha)} adjuntos={c.adjuntos}>
              {c.mensaje}
            </Bubble>
          )
        )}

        {!loading && conversaciones.filter(c => !isSystem(c.mensaje)).length === 0 && (
          <div className="flex flex-col items-center text-center py-2">
            <Michi pose="laptop" size={110} title="" />
            <p className="text-sm text-muted">Michi y el equipo ya están en ello. Te responderán por aquí.</p>
          </div>
        )}
        <div ref={endRef} />
      </section>

      {/* Responder */}
      <section
        {...draft.dropProps}
        className={`bg-surface rounded-2xl border p-3 sm:p-4 sticky bottom-4 shadow-lg transition ${
          draft.dragging ? "border-brand ring-2 ring-brand/30" : "border-line"
        }`}
      >
        {ticket.status === "resolved" && (
          <p className="text-xs text-muted mb-2 px-1">
            Este ticket está resuelto. Si el problema continúa, escríbenos y lo revisaremos.
          </p>
        )}
        <div className="-mx-3 sm:-mx-4"><DraftThumbs draft={draft} /></div>
        <div className="flex items-end gap-2">
          <AttachButton draft={draft} disabled={sending} compact />
          <textarea
            value={text} onChange={e => setText(e.target.value)} rows={2}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            onPaste={draft.onPaste}
            placeholder={draft.dragging ? "Suelta aquí la imagen…" : "Escribe un mensaje al equipo de soporte…"}
            className="flex-1 px-3 py-2.5 rounded-xl border border-line-strong bg-field text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 placeholder:text-faint resize-none"
          />
          <button
            onClick={send} disabled={(!text.trim() && draft.files.length === 0) || sending} title="Enviar"
            className="h-11 w-11 rounded-xl bg-brand hover:bg-brand-hover text-white flex items-center justify-center disabled:opacity-50 flex-shrink-0"
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        {error && <p className="text-xs text-danger mt-1.5 px-1">{error}</p>}
        <p className="text-[11px] text-faint mt-1.5 px-1 hidden sm:block">Enter para enviar · Shift + Enter para salto de línea · Ctrl + V o arrastra para adjuntar una captura</p>
      </section>
    </div>
  );
}
