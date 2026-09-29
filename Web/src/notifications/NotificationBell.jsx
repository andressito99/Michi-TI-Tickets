// Campana de la barra superior: historial de notificaciones y estado de la conexión en tiempo real.
import { useState, useRef, useEffect } from "react";
import { Bell, BellRing, CheckCheck, MonitorSmartphone } from "lucide-react";
import { useNotifications } from "./NotificationsProvider";
import { useRealtimeStatus } from "../lib/realtime";
import { Michi } from "../components/ui/Michi";

const STATUS_TEXT = {
  open:         { text: "En tiempo real",   dot: "bg-success" },
  connecting:   { text: "Conectando…",      dot: "bg-warning" },
  reconnecting: { text: "Reconectando…",    dot: "bg-warning animate-pulse" },
  closed:       { text: "Sin conexión",     dot: "bg-faint" },
};

function timeAgo(ts) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "ahora";
  const m = Math.round(s / 60);
  if (m < 60) return `hace ${m} min`;
  return `hace ${Math.round(m / 60)} h`;
}

export function NotificationBell() {
  const ctx = useNotifications();
  const status = useRealtimeStatus();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = e => { if (!ref.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!ctx) return null;
  const { items, unread, permission, requestPermission, open: openNote, markAllRead } = ctx;
  const st = STATUS_TEXT[status] ?? STATUS_TEXT.closed;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        title={unread ? `${unread} notificaciones sin leer` : "Notificaciones"}
        aria-label="Notificaciones"
        className="relative w-9 h-9 rounded-lg flex items-center justify-center text-white/80 hover:bg-navy-2 hover:text-white transition-colors"
      >
        {unread ? <BellRing size={18} /> : <Bell size={18} />}
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold leading-4 text-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
        <span className={`absolute bottom-1.5 right-1.5 w-1.5 h-1.5 rounded-full ${st.dot}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-[min(360px,calc(100vw-2rem))] bg-surface rounded-xl border border-line shadow-2xl z-50 overflow-hidden text-ink">
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <p className="font-semibold text-sm flex-1">Notificaciones</p>
            <span className="text-[11px] text-muted inline-flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${st.dot}`} /> {st.text}
            </span>
            {unread > 0 && (
              <button onClick={markAllRead} title="Marcar todo como leído"
                className="w-7 h-7 rounded-md text-muted hover:text-ink hover:bg-hover flex items-center justify-center">
                <CheckCheck size={15} />
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto thin-scroll">
            {items.length === 0 ? (
              <div className="py-8 px-6 text-center">
                <Michi pose="sleep" size={90} className="mx-auto" title="" />
                <p className="text-sm text-muted mt-1">Sin novedades. Michi te avisará al momento.</p>
              </div>
            ) : items.map(n => (
              <button
                key={n.id} onClick={() => { openNote(n); setOpen(false); }}
                className={`w-full text-left px-4 py-3 border-b border-line last:border-none flex gap-3 hover:bg-hover transition-colors ${n.read ? "" : "bg-brand-soft/60"}`}
              >
                <span className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? "bg-transparent" : "bg-brand"}`} />
                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-medium text-ink leading-snug">{n.title}</span>
                  {n.body && <span className="block text-xs text-muted line-clamp-2 mt-0.5">{n.body}</span>}
                  <span className="block text-[11px] text-faint mt-1">{timeAgo(n.at)}</span>
                </span>
              </button>
            ))}
          </div>

          {permission === "default" && (
            <button onClick={requestPermission}
              className="w-full px-4 py-2.5 border-t border-line text-xs font-semibold text-brand hover:bg-hover flex items-center justify-center gap-1.5">
              <MonitorSmartphone size={14} /> Activar notificaciones del escritorio
            </button>
          )}
          {permission === "denied" && (
            <p className="px-4 py-2.5 border-t border-line text-[11px] text-faint text-center">
              Las notificaciones del escritorio están bloqueadas en este navegador.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
