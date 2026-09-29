// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Cliente de notificaciones en tiempo real (Server-Sent Events).
//
// Se usa fetch() con lectura en streaming en lugar de EventSource porque EventSource
// no permite enviar el token en la cabecera Authorization (habría que ponerlo en la URL,
// donde queda registrado en logs e historial).
import { useEffect, useRef, useSyncExternalStore } from "react";
import { BASE_URL, getToken } from "./api";

const listeners = new Set();       // (evento) => void
const statusListeners = new Set(); // () => void
let status = "closed";             // "connecting" | "open" | "reconnecting" | "closed"
let running = false;
let controller = null;

const setStatus = s => { status = s; statusListeners.forEach(fn => fn()); };
const emit = event => listeners.forEach(fn => { try { fn(event); } catch (e) { console.error(e); } });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const WATCHDOG_MS = 40_000; // sin latidos durante este tiempo → reconectar

/** Abre la conexión (se llama al iniciar sesión). Se reconecta sola si se corta. */
export function startRealtime() {
  if (running) return;
  running = true;
  loop();
}

/** Cierra la conexión (se llama al cerrar sesión). */
export function stopRealtime() {
  running = false;
  controller?.abort();
  setStatus("closed");
}

async function loop() {
  let attempt = 0;
  let firstConnection = true;
  while (running) {
    setStatus(firstConnection ? "connecting" : "reconnecting");
    controller = new AbortController();
    const current = controller;
    let watchdog = null;
    try {
      const res = await fetch(`${BASE_URL}/events`, {
        headers: { Authorization: `Bearer ${getToken()}`, Accept: "text/event-stream" },
        signal: current.signal,
      });
      if (res.status === 401) { running = false; break; }   // la sesión caducó: App se encarga
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      attempt = 0;
      setStatus("open");
      // Tras una reconexión se avisa para que cada pantalla recargue lo que se perdió
      emit({ type: "connected", reconnected: !firstConnection });
      firstConnection = false;

      // Vigilante: el servidor manda un latido cada 15 s. Si pasan 40 s sin recibir nada,
      // la conexión está muerta (por ejemplo, un proxy la dejó colgada) y se abre otra.
      let lastActivity = Date.now();
      watchdog = setInterval(() => {
        if (Date.now() - lastActivity > WATCHDOG_MS) current.abort();
      }, 5000);

      const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        lastActivity = Date.now();
        buffer += value.replace(/\r\n/g, "\n");
        let idx;
        while ((idx = buffer.indexOf("\n\n")) >= 0) {
          handleBlock(buffer.slice(0, idx));
          buffer = buffer.slice(idx + 2);
        }
      }
    } catch {
      /* conexión cortada o abortada por el vigilante: se reintenta abajo */
    } finally {
      clearInterval(watchdog);
    }
    if (!running) break;
    // Reintento con espera creciente: 1 s, 2 s, 4 s… hasta 30 s
    setStatus("reconnecting");
    await sleep(Math.min(30_000, 1000 * 2 ** attempt++));
  }
  if (!running) setStatus("closed");
}

function handleBlock(block) {
  const data = block
    .split("\n")
    .filter(line => line.startsWith("data:"))
    .map(line => line.slice(5).trimStart())
    .join("\n");
  if (!data) return; // comentarios de "latido" (": ping")
  try {
    emit(JSON.parse(data));
  } catch { /* evento mal formado: se ignora */ }
}

/** Suscribe una función a todos los eventos. Devuelve la función para desuscribirse. */
export function onRealtime(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Hook: ejecuta `handler(evento)` con cada evento en tiempo real.
 * Siempre usa la versión más reciente del handler sin volver a suscribirse.
 */
export function useRealtime(handler) {
  const ref = useRef(handler);
  useEffect(() => { ref.current = handler; });
  useEffect(() => onRealtime(e => ref.current(e)), []);
}

/**
 * Hook: llama a `refresh()` cuando llega un evento que cumple `matches(evento)`.
 * Agrupa los eventos seguidos (un cambio de estado suele traer dos) en una sola recarga.
 */
export function useRealtimeRefresh(matches, refresh, delay = 250) {
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  useRealtime(event => {
    if (!matches(event)) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(refresh, delay);
  });
}

/** Hook: estado de la conexión ("open", "reconnecting"…). */
export function useRealtimeStatus() {
  return useSyncExternalStore(
    fn => { statusListeners.add(fn); return () => statusListeners.delete(fn); },
    () => status
  );
}

/** Eventos que afectan a la lista de tickets. */
export const isTicketEvent = e =>
  ["ticket.created", "ticket.updated", "message.created"].includes(e.type) ||
  (e.type === "connected" && e.reconnected);
