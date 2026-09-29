// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Atribución del proyecto (pide mostrarla el archivo NOTICE de la Licencia Apache 2.0).
import { APP_NAME, APP_TAGLINE } from "./Brand";

export const APP_VERSION = "1.0.0";
export const APP_AUTHOR  = "andressito99";
export const REPO_URL    = "https://github.com/andressito99/Michi-TI-Tickets";
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENCIA.md`;

/**
 * Línea de créditos: "Michi · Soporte TI con siete vidas · v1.0.0 · © 2026 andressito99 · Licencia Apache 2.0".
 * `tone="dark"` para fondos azul marino (login), `"light"` para menús.
 */
export function Credits({ tone = "light", className = "" }) {
  const base = tone === "dark" ? "text-white/45" : "text-faint";
  const link = tone === "dark" ? "hover:text-white/80" : "hover:text-brand";
  return (
    <p className={`text-[11px] leading-relaxed ${base} ${className}`}>
      <a href={REPO_URL} target="_blank" rel="noreferrer" className={`font-semibold ${link}`}>
        {APP_NAME} · {APP_TAGLINE}
      </a>{" "}
      · v{APP_VERSION} · © 2026 {APP_AUTHOR} ·{" "}
      <a href={LICENSE_URL} target="_blank" rel="noreferrer" className={`underline underline-offset-2 whitespace-nowrap ${link}`}>
        Licencia Apache 2.0
      </a>
    </p>
  );
}
