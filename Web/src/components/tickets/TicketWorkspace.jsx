import { useState, useRef, useEffect } from "react";
import {
  X, ChevronDown, ChevronRight, ArrowRight, ArrowLeft, PanelRightOpen, Send, Sparkles, Loader2, Ticket as TicketIcon,
  Clock, CheckCircle2, Timer, Building2, Tag, History, Info, MessageSquareText, Activity, BookOpenCheck,
} from "lucide-react";
import { ForoEditor } from "../../foro/ForoEditor";
import { STATUSES, STATUS_LABELS } from "./StatusBadge";
import { PRIORITIES, PriorityIcon } from "./PriorityBadge";
import { Avatar } from "../ui/Avatar";
import { useConversaciones } from "../../hooks/useConversaciones";
import { api } from "../../lib/api";
import { formatDuration } from "../../utils/ticketUtils";

const SYSTEM_PREFIX = "[Sistema]";
const isSystemMessage = m => m.split(/\n\s*\n/).every(p => p.trim().startsWith(SYSTEM_PREFIX));
const stripSystem = m => m.split(/\n\s*\n/).map(p => p.trim().replace(SYSTEM_PREFIX, "").trim());

const fullDate = iso => iso
  ? new Date(iso).toLocaleString("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
  : "—";

// ── Desplegable de estado (botón azul con flecha, como la referencia) ─────
function StatusMenu({ status, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const current = STATUSES.find(s => s.key === status) ?? STATUSES[0];
  return (
    <div className="relative" ref={ref}>
      <div className="flex rounded-lg overflow-hidden shadow-sm">
        <span className="h-9 pl-3.5 pr-3 flex items-center gap-2 bg-brand text-white text-sm font-semibold">
          {current.label}
        </span>
        <button
          onClick={() => setOpen(o => !o)} disabled={disabled}
          className="h-9 w-9 flex items-center justify-center bg-brand hover:bg-brand-hover text-white border-l border-white/25 disabled:opacity-60"
          title="Cambiar estado"
        >
          {disabled ? <Loader2 size={15} className="animate-spin" /> : <ChevronDown size={16} />}
        </button>
      </div>
      {open && (
        <div className="absolute left-0 top-11 w-64 bg-surface rounded-xl border border-line shadow-2xl z-30 py-1.5">
          {STATUSES.filter(s => s.key !== status).map(s => (
            <button
              key={s.key}
              onClick={() => { setOpen(false); onChange(s.key); }}
              className="w-full px-3.5 py-2.5 flex items-start gap-3 text-left hover:bg-hover transition-colors"
            >
              <ArrowRight size={17} className="text-muted mt-0.5" />
              <span>
                <span className="block text-sm font-semibold text-ink">{s.label}</span>
                <span className="block text-xs text-faint">{s.hint}</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <p className="text-xs font-semibold text-ink-2 mb-1.5">{label}</p>
      {children}
    </div>
  );
}

const boxCls = "w-full h-9 px-3 rounded-lg border border-line-strong bg-field text-sm text-ink flex items-center gap-2";
const selectCls = `${boxCls} outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 cursor-pointer disabled:cursor-default disabled:opacity-70`;

function Section({ title, count, Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-t border-line">
      <button onClick={() => setOpen(o => !o)} className="w-full px-5 py-3 flex items-center gap-2 hover:bg-hover transition-colors">
        <Icon size={14} className="text-faint" />
        <span className="text-[11px] font-bold text-ink-2 uppercase tracking-wider">{title}</span>
        {count != null && <span className="text-[11px] font-semibold text-muted bg-subtle border border-line rounded px-1.5">{count}</span>}
        <span className="ml-auto w-6 h-6 rounded-md bg-subtle border border-line flex items-center justify-center text-muted">
          {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>
      </button>
      {open && <div className="px-5 pb-4">{children}</div>}
    </div>
  );
}

// ── Tarjetas de la conversación ─────────────────────────────────────────
function MessageCard({ author, date, to, children, highlight }) {
  return (
    <div className={`bg-surface rounded-xl border px-5 py-4 ${highlight ? "border-brand/30" : "border-line"}`}>
      <div className="flex items-start gap-3">
        <Avatar name={author} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <p className="text-sm font-semibold text-ink">{author}</p>
            <p className="ml-auto text-xs text-faint whitespace-nowrap">{date}</p>
          </div>
          {to && <p className="text-xs text-faint mb-2">{to}</p>}
          <div className="text-sm text-ink-2 leading-relaxed whitespace-pre-wrap">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SystemEvent({ text, author, date }) {
  return (
    <div className="flex items-center gap-2.5 px-2 text-xs text-muted">
      <span className="w-6 h-6 rounded-full bg-subtle border border-line flex items-center justify-center flex-shrink-0">
        <Activity size={12} className="text-faint" />
      </span>
      <span className="flex-1"><span className="font-semibold text-ink-2">{author}</span> · {text}</span>
      <span className="text-faint whitespace-nowrap">{date}</span>
    </div>
  );
}

// ── Workspace ───────────────────────────────────────────────────────────
export function TicketWorkspace({ ticket, agents, isAgent, onSave, onClose }) {
  const { conversaciones, loading, addConversacion } = useConversaciones(ticket._id);
  const [reply, setReply]         = useState("");
  const [sending, setSending]     = useState(false);
  const [updating, setUpdating]   = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [notice, setNotice]       = useState(null); // { type: "error" | "ok", text }
  const [foroDraft, setForoDraft] = useState(null); // borrador/publicación abierta en el editor del foro
  const [foroLoading, setForoLoading] = useState(false);
  const [showProps, setShowProps]     = useState(false); // panel de propiedades en pantallas medianas

  // Abre el editor del foro con un borrador anónimo (o la publicación existente de este ticket)
  const openForo = async () => {
    setForoLoading(true);
    try {
      const { publicacion } = await api.get(`/foro/borrador/ticket/${ticket._id}`);
      setForoDraft(publicacion);
    } catch (err) {
      flash("error", err.message);
    } finally {
      setForoLoading(false);
    }
  };

  const flash = (type, text) => {
    setNotice({ type, text });
    if (type === "ok") setTimeout(() => setNotice(null), 2500);
  };

  // Aplica un cambio al ticket y deja constancia en el historial
  const applyChange = async (changes, logText) => {
    setUpdating(true);
    const ok = await onSave(ticket.id, changes);
    if (ok === false) flash("error", "No se pudo guardar el cambio");
    else await addConversacion(`${SYSTEM_PREFIX} ${logText}`);
    setUpdating(false);
  };

  const changeStatus = key => applyChange({ status: key }, `Estado cambiado a: ${STATUS_LABELS[key]}`);

  const changeAgent = id => {
    const agent = agents.find(a => a.id === id);
    applyChange(
      { agentRawId: id ? parseInt(id) : null, agent: agent?.name ?? "Sin asignar", agentInitials: agent?.initials ?? "" },
      `Ticket asignado a: ${agent?.name ?? "Sin asignar"}`
    );
  };

  const changePriority = key => {
    const label = PRIORITIES.find(p => p.key === key)?.label ?? key;
    applyChange({ priority: key }, `Prioridad cambiada a: ${label}`);
  };

  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    const res = await addConversacion(text);
    setSending(false);
    if (res?.success) { setReply(""); flash("ok", "Respuesta enviada"); }
    else flash("error", res?.error || "No se pudo enviar la respuesta");
  };

  // Borrador de respuesta generado por DeepSeek a partir del ticket y su historial
  const suggestReply = async () => {
    setAiLoading(true);
    setNotice(null);
    try {
      const { respuesta } = await api.post(`/ai/tickets/${ticket._id}/sugerir-respuesta`);
      setReply(prev => (prev.trim() ? `${prev.trim()}\n\n${respuesta}` : respuesta));
    } catch (err) {
      flash("error", err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const done = ticket.status === "resolved" || ticket.status === "closed";
  const hoursOpen = ticket.rawFecha ? (Date.now() - new Date(ticket.rawFecha)) / 3_600_000 : 0;
  const ageColor = done ? "text-success" : hoursOpen < 4 ? "text-muted" : hoursOpen < 24 ? "text-warning" : hoursOpen < 72 ? "text-[#ea580c]" : "text-danger";
  const newestFirst = [...conversaciones].reverse();
  const systemEvents = conversaciones.filter(c => isSystemMessage(c.mensaje));

  return (
    <>
      {/* ── Columna central: conversación ─────────────────────────── */}
      <section className="flex-1 min-w-0 flex flex-col min-h-0">
        <header className="px-4 @3xl:px-6 pt-3 @3xl:pt-4 pb-3 bg-surface border-b border-line">
          <button
            onClick={onClose}
            className="@4xl:hidden mb-2 text-sm text-muted hover:text-ink inline-flex items-center gap-1.5"
          >
            <ArrowLeft size={15} /> Tickets
          </button>
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-ink tracking-tight truncate">{ticket.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted flex-wrap">
                <TicketIcon size={13} className="text-brand" />
                <span className="font-mono font-medium">{ticket.id}</span>
                <span className="text-line-strong">|</span>
                <span>{ticket.category}</span>
                <span className="text-line-strong">|</span>
                <span>Creado {fullDate(ticket.rawFecha)}</span>
              </div>
            </div>
            <div className="hidden @2xl:flex -space-x-1.5 pt-1">
              <Avatar name={ticket.requester} size="md" ring />
              <Avatar name={ticket.agent} size="md" ring />
            </div>
            <button
              onClick={() => setShowProps(true)}
              className="@6xl:hidden h-9 px-3 rounded-lg border border-line-strong text-sm font-semibold text-ink-2 hover:bg-hover inline-flex items-center gap-1.5 flex-shrink-0"
            >
              <PanelRightOpen size={15} /> Detalles
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto thin-scroll px-4 @3xl:px-6 py-5 flex flex-col gap-4">
          {/* Editor de respuesta */}
          <div className="bg-surface rounded-xl border border-line shadow-sm focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/10 transition">
            <div className="px-4 flex items-center gap-5 border-b border-line">
              <span className="py-2.5 text-xs font-semibold text-brand border-b-2 border-brand -mb-px">Respuesta pública</span>
              <span className="py-2.5 text-xs text-faint">Visible para el usuario en la app</span>
            </div>
            <div className="px-4 py-2 flex items-center gap-2 border-b border-line text-xs text-muted">
              Para:
              <span className="inline-flex items-center gap-1.5 pl-0.5 pr-2 py-0.5 rounded-full bg-subtle border border-line text-ink-2">
                <Avatar name={ticket.requester} size="xs" /> {ticket.requester}
              </span>
            </div>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) sendReply(); }}
              placeholder="Escribe una respuesta…  (Ctrl + Enter para enviar)"
              rows={4}
              className="w-full px-4 py-3 bg-transparent text-sm text-ink outline-none resize-none placeholder:text-faint leading-relaxed"
            />
            <div className="px-3 py-2 flex items-center gap-2 border-t border-line">
              <button
                onClick={suggestReply} disabled={aiLoading || sending}
                className="h-8 px-2.5 rounded-lg text-xs font-semibold text-[#7c3aed] dark:text-[#a78bfa] hover:bg-[#7c3aed]/10 flex items-center gap-1.5 disabled:opacity-60 transition-colors"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? "Redactando…" : "Sugerir con IA"}
              </button>
              {notice && (
                <span className={`text-xs truncate ${notice.type === "error" ? "text-danger" : "text-success"}`} title={notice.text}>
                  {notice.text}
                </span>
              )}
              <button
                onClick={sendReply} disabled={!reply.trim() || sending}
                className="ml-auto h-8 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                Enviar
              </button>
            </div>
          </div>

          {/* Mensajes, del más reciente al más antiguo */}
          {loading && conversaciones.length === 0 ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-faint" /></div>
          ) : (
            newestFirst.map(c =>
              isSystemMessage(c.mensaje)
                ? stripSystem(c.mensaje).map((text, i) => (
                    <SystemEvent key={`${c.id}-${i}`} text={text} author={c.usuario} date={fullDate(c.rawFecha)} />
                  ))
                : (
                  <MessageCard key={c.id} author={c.usuario} date={fullDate(c.rawFecha)}>
                    {c.mensaje}
                  </MessageCard>
                )
            )
          )}

          {/* Reporte original */}
          <MessageCard author={ticket.requester} date={fullDate(ticket.rawFecha)} to="Reporte original" highlight>
            {ticket.desc || "Sin descripción."}
          </MessageCard>
        </div>
      </section>

      {/* ── Columna derecha: propiedades ──────────────────────────────
           Ancho: columna fija. Mediano/estrecho: panel deslizante con "Detalles". */}
      {showProps && (
        <div className="@6xl:hidden absolute inset-0 z-20 bg-navy/30" onClick={() => setShowProps(false)} />
      )}
      <aside className={`w-[300px] max-w-[88%] flex-shrink-0 bg-surface border-l border-line flex-col min-h-0
        ${showProps ? "flex absolute right-0 top-0 bottom-0 z-30 shadow-2xl" : "hidden"}
        @6xl:flex @6xl:static @6xl:z-auto @6xl:shadow-none`}>
        <div className="px-5 py-4 flex items-center gap-2">
          <StatusMenu status={ticket.status} onChange={changeStatus} disabled={updating} />
          <button
            onClick={() => (showProps ? setShowProps(false) : onClose())} title="Cerrar"
            className="ml-auto w-8 h-8 rounded-lg border border-line-strong flex items-center justify-center text-muted hover:bg-hover transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll">
          <div className="px-5 pb-5 flex flex-col gap-4">
            <Field label="Agente asignado">
              {isAgent ? (
                <div className={boxCls}><Avatar name={ticket.agent} size="xs" /> {ticket.agent}</div>
              ) : (
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                    <Avatar name={ticket.agent} size="xs" />
                  </span>
                  <select
                    value={ticket.agentRawId != null ? String(ticket.agentRawId) : ""}
                    onChange={e => changeAgent(e.target.value)} disabled={updating}
                    className={`${selectCls} pl-9`}
                  >
                    <option value="">Sin asignar</option>
                    {agents.map(a => (
                      <option key={a.id} value={a.id} title={a.especialidad}>{a.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </Field>

            <Field label="Prioridad">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none flex">
                  <PriorityIcon priority={ticket.priority} size={16} />
                </span>
                <select
                  value={ticket.priority} onChange={e => changePriority(e.target.value)}
                  disabled={isAgent || updating}
                  className={`${selectCls} pl-9`}
                >
                  {PRIORITIES.map(p => <option key={p.key} value={p.key}>{p.label}</option>)}
                </select>
              </div>
            </Field>

            <Field label="Categoría">
              <div className={boxCls}><Tag size={14} className="text-faint" /> <span className="truncate">{ticket.category}</span></div>
            </Field>

            <Field label="Solicitante">
              <div className={boxCls}><Avatar name={ticket.requester} size="xs" /> <span className="truncate">{ticket.requester}</span></div>
            </Field>

            <Field label={done ? "Tiempo de resolución" : "Tiempo abierto"}>
              <div className={boxCls}>
                {done ? <CheckCircle2 size={14} className={ageColor} /> : <Timer size={14} className={ageColor} />}
                <span className={`font-semibold ${ageColor}`}>{formatDuration(ticket.rawFecha)}</span>
                {ticket.incidenteTiempo && <span className="ml-auto text-xs text-faint">Est. {ticket.incidenteTiempo}</span>}
              </div>
            </Field>
          </div>

          {!isAgent && ticket.status === "resolved" && (
            <div className="mx-5 mb-5 rounded-xl border border-success/30 bg-success/5 p-3.5">
              <p className="text-xs text-ink-2 leading-snug">
                <b>¿Puede ayudar a otros?</b> Publica este caso en el foro de soluciones. Se publica sin datos del usuario.
              </p>
              <button
                onClick={openForo} disabled={foroLoading}
                className="mt-2.5 w-full h-9 rounded-lg bg-success hover:brightness-110 text-white text-sm font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-60"
              >
                {foroLoading ? <Loader2 size={15} className="animate-spin" /> : <BookOpenCheck size={15} />} Publicar en el foro
              </button>
            </div>
          )}

          <Section title="Detalles" Icon={Info} defaultOpen>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs">
              <dt className="text-faint flex items-center gap-1.5"><Building2 size={12} /> Departamento</dt>
              <dd className="text-ink-2 text-right truncate">{ticket.departamento || "—"}</dd>
              <dt className="text-faint flex items-center gap-1.5"><Clock size={12} /> Creado</dt>
              <dd className="text-ink-2 text-right">{fullDate(ticket.rawFecha)}</dd>
              <dt className="text-faint flex items-center gap-1.5"><Timer size={12} /> Tiempo estimado</dt>
              <dd className="text-ink-2 text-right">{ticket.incidenteTiempo || "—"}</dd>
              <dt className="text-faint flex items-center gap-1.5"><MessageSquareText size={12} /> Mensajes</dt>
              <dd className="text-ink-2 text-right">{conversaciones.length - systemEvents.length}</dd>
            </dl>
          </Section>

          <Section title="Historial" Icon={History} count={systemEvents.length}>
            {systemEvents.length === 0 ? (
              <p className="text-xs text-faint">Sin cambios registrados.</p>
            ) : (
              <ol className="flex flex-col gap-2.5">
                {[...systemEvents].reverse().map(c => (
                  <li key={c.id} className="text-xs">
                    {stripSystem(c.mensaje).map((t, i) => <p key={i} className="text-ink-2">{t}</p>)}
                    <p className="text-faint mt-0.5">{c.usuario} · {fullDate(c.rawFecha)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Section>
        </div>
      </aside>

      {foroDraft && (
        <ForoEditor
          initial={foroDraft}
          onClose={() => setForoDraft(null)}
          onSaved={saved => {
            setForoDraft(null);
            flash("ok", saved.Estado === "publicado" ? "Publicado en el foro" : "Guardado en el foro sin publicar");
          }}
        />
      )}
    </>
  );
}
