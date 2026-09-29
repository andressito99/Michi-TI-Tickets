// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// La "voz" de Michi: frases con personalidad gatuna para toda la app.

export const pick = list => list[Math.floor(Math.random() * list.length)];

export const LOADING_LINES = [
  "Michi está buscando…",
  "Persiguiendo el cable…",
  "Ronroneando con el servidor…",
  "Revisando debajo del sofá…",
  "Afilando las uñas…",
  "Buscando en la caja de arena…",
];

export const MEOWS = [
  "¡Miau!",
  "Prrr… prrr…",
  "¿Ya probaste a reiniciarlo?",
  "¡Hola, humano!",
  "Tengo siete vidas, pero solo un teclado 😼",
  "No toques mi ovillo de cables",
  "¿Me traes un café? ☕",
  "Estoy de guardia 🐾",
];

export const TIPS = [
  "Reiniciar el equipo resuelve más problemas de los que crees.",
  "Si el Wi-Fi va lento, prueba la red de 5 GHz: hay menos interferencias.",
  "Nunca compartas tu contraseña, ni siquiera conmigo. Y yo soy muy de fiar.",
  "Antes de reportar, echa un vistazo al foro: quizá alguien ya lo resolvió.",
  "Si ves un correo sospechoso, no hagas clic: repórtalo en «Seguridad».",
  "Guarda tus archivos en la carpeta compartida, no en el escritorio.",
  "Un mensaje de error vale oro: haz una captura y adjúntala al reporte.",
  "Bloquea tu equipo (Windows + L) cuando te levantes. Yo lo hago con la cola.",
];

export function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 6)  return "¿Trasnochando?";
  if (h < 13) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/** Estado de ánimo de Michi según la carga de trabajo (dashboards). */
export function moodFor({ urgent = 0, pending = 0 }) {
  if (urgent > 0) {
    return { pose: "sad", text: `Hay ${urgent} ticket${urgent > 1 ? "s" : ""} urgente${urgent > 1 ? "s" : ""}. ¡Garras a la obra!` };
  }
  if (pending > 0) {
    return { pose: "laptop", text: `${pending} ticket${pending > 1 ? "s" : ""} por atender. Michi ya tiene el café listo.` };
  }
  return { pose: "celebrate", text: "¡Todo resuelto! Michi se va a dormir la siesta." };
}
