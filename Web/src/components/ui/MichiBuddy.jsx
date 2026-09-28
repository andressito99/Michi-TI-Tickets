import { useState, useRef, useEffect } from "react";
import { Michi } from "./Michi";
import { MEOWS, pick } from "../../utils/michiVoice";

/** Bocadillo de diálogo de Michi. `tail` indica hacia dónde apunta el piquito. */
export function SpeechBubble({ children, tail = "bottom", className = "" }) {
  const tails = {
    bottom: "left-1/2 -translate-x-1/2 -bottom-1.5 border-r border-b",
    left:   "-left-1.5 top-1/2 -translate-y-1/2 border-l border-b",
    right:  "-right-1.5 top-1/2 -translate-y-1/2 border-r border-t",
  };
  return (
    <div className={`relative bg-surface text-ink text-sm font-medium rounded-2xl px-3.5 py-2 shadow-lg border border-line ${className}`}>
      {children}
      <span className={`absolute w-3 h-3 bg-surface border-line rotate-45 ${tails[tail]}`} />
    </div>
  );
}

/**
 * Michi interactivo: al hacer clic maúlla (bocadillo con una frase al azar) y da un saltito.
 * `say` muestra un bocadillo fijo.
 */
export function MichiBuddy({ pose = "sit", size = 120, say, bubbleClassName = "", className = "", title }) {
  const [meow, setMeow] = useState(null);
  const [hop, setHop]   = useState(false);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const poke = () => {
    setMeow(prev => {
      let next = pick(MEOWS);
      while (next === prev) next = pick(MEOWS);
      return next;
    });
    setHop(false);
    requestAnimationFrame(() => setHop(true));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => { setMeow(null); setHop(false); }, 2600);
  };

  const text = meow ?? say;

  // Respeta la posición y la visibilidad que indique quien lo usa
  const classes = className.split(/\s+/);
  const pos     = classes.some(c => c === "absolute" || c === "fixed") ? "" : "relative";
  const display = classes.some(c => ["hidden", "flex", "block"].includes(c)) ? "" : "inline-flex";

  return (
    <span className={`${pos} ${display} flex-col items-center ${className}`}>
      {text && (
        <SpeechBubble className={`absolute bottom-full mb-1 whitespace-nowrap z-10 michi-bubble ${bubbleClassName}`}>
          {text}
        </SpeechBubble>
      )}
      <button
        type="button" onClick={poke}
        title="Haz clic en Michi"
        aria-label="Michi (haz clic para que maúlle)"
        className={`cursor-pointer rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-brand ${hop ? "michi-hop" : ""}`}
      >
        <Michi pose={pose} size={size} title={title} />
      </button>
    </span>
  );
}

/** Michi dormido como marca de agua del fondo (decorativo). */
export function MichiWatermark({ fixed = false, className = "" }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none select-none ${fixed ? "fixed" : "absolute"} -bottom-10 -right-8 opacity-[0.045] dark:opacity-[0.06] michi-silhouette ${className}`}>
      <Michi pose="sleep" size={360} title="" />
    </div>
  );
}
