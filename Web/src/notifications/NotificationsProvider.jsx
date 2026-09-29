// Centro de notificaciones: escucha los eventos en tiempo real, muestra avisos emergentes,
// guarda el historial para la campana y, si la pestaña está en segundo plano y hay permiso,
// lanza notificaciones del escritorio.
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { useRealtime } from "../lib/realtime";
import { describeEvent } from "./describe";
import { Michi } from "../components/ui/Michi";

const NotificationsContext = createContext(null);
const MAX_ITEMS = 30;
const TOAST_MS  = 6000;
const BASE_TITLE = document.title;

const desktopSupported = typeof window !== "undefined" && "Notification" in window;

export function NotificationsProvider({ user, children }) {
  const [items, setItems]   = useState([]);  // historial (campana)
  const [toasts, setToasts] = useState([]);  // avisos visibles
  const [permission, setPermission] = useState(desktopSupported ? Notification.permission : "unsupported");
  const openHandler = useRef(null);
  const nextId = useRef(1);

  const dismiss = useCallback(id => setToasts(prev => prev.filter(t => t.id !== id)), []);

  const open = useCallback(note => {
    setItems(prev => prev.map(n => (n.id === note.id ? { ...n, read: true } : n)));
    dismiss(note.id);
    openHandler.current?.(note);
  }, [dismiss]);

  useRealtime(event => {
    const info = describeEvent(event, user);
    if (!info) return;
    const note = { ...info, id: nextId.current++, at: Date.now(), read: false };

    setItems(prev => [note, ...prev].slice(0, MAX_ITEMS));
    setToasts(prev => [...prev, note].slice(-3));
    setTimeout(() => dismiss(note.id), TOAST_MS);

    // Con la pestaña en segundo plano: notificación del sistema operativo
    if (document.hidden && desktopSupported && Notification.permission === "granted") {
      const n = new Notification(note.title, { body: note.body, icon: "/favicon.svg", tag: `michi-${note.ticketId ?? note.kind}` });
      n.onclick = () => { window.focus(); open(note); n.close(); };
    }
  });

  const unread = items.filter(n => !n.read).length;

  // "(2) Michi · Soporte TI" en la pestaña del navegador
  useEffect(() => {
    document.title = unread > 0 ? `(${unread}) ${BASE_TITLE}` : BASE_TITLE;
    return () => { document.title = BASE_TITLE; };
  }, [unread]);

  const requestPermission = useCallback(async () => {
    if (!desktopSupported) return;
    setPermission(await Notification.requestPermission());
  }, []);

  const value = useMemo(() => ({
    items, unread, permission, requestPermission, open,
    markAllRead: () => setItems(prev => prev.map(n => ({ ...n, read: true }))),
    clear: () => setItems([]),
    setOpenHandler: fn => { openHandler.current = fn; },
  }), [items, unread, permission, requestPermission, open]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onOpen={open} onDismiss={dismiss} />
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}

/** Registra qué hacer al pulsar una notificación (cada panel sabe cómo abrir un ticket). */
export function useNotificationHandler(handler) {
  const ctx = useNotifications();
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => {
    ctx?.setOpenHandler(note => ref.current(note));
    return () => ctx?.setOpenHandler(null);
  }, [ctx]);
}

const TONES = {
  info:    "border-l-brand",
  success: "border-l-success",
  warning: "border-l-warning",
  danger:  "border-l-danger",
};

function Toaster({ toasts, onOpen, onDismiss }) {
  return (
    // Arriba a la derecha, bajo la barra: abajo taparía el botón de enviar del chat
    <div className="fixed top-[4.25rem] right-4 z-[70] flex flex-col gap-2 w-[min(360px,calc(100vw-2rem))]" role="status" aria-live="polite">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`michi-bubble group bg-surface border border-line border-l-4 ${TONES[t.tone] ?? TONES.info} rounded-xl shadow-2xl flex items-start gap-3 p-3 cursor-pointer hover:bg-hover transition-colors`}
          onClick={() => onOpen(t)}
        >
          <span className="w-9 h-9 rounded-lg bg-brand flex items-center justify-center flex-shrink-0">
            <Michi pose="logo" size={30} title="" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink leading-snug">{t.title}</p>
            {t.body && <p className="text-xs text-muted mt-0.5 line-clamp-2">{t.body}</p>}
          </div>
          <button
            onClick={e => { e.stopPropagation(); onDismiss(t.id); }}
            className="w-6 h-6 rounded-md text-faint hover:text-ink hover:bg-subtle flex items-center justify-center flex-shrink-0"
            aria-label="Cerrar aviso"
          >
            <X size={13} />
          </button>
        </div>
      ))}
    </div>
  );
}
