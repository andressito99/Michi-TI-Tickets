import { Michi } from "./Michi";

export const APP_NAME    = "Michi";
export const APP_TAGLINE = "Soporte TI con siete vidas";

const SIZES = {
  sm: { tile: "w-9 h-9 rounded-xl",   face: 32, text: "text-[18px]" },
  md: { tile: "w-10 h-10 rounded-xl", face: 36, text: "text-xl" },
  lg: { tile: "w-14 h-14 rounded-2xl", face: 50, text: "text-3xl" },
};

/** Logo de Michi: la cara del gato con auriculares de soporte, centrada en un cuadrado azul. */
export function Brand({ size = "sm", tagline = false, className = "" }) {
  const s = SIZES[size];
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <span className={`${s.tile} bg-brand flex items-center justify-center shadow-sm flex-shrink-0`}>
        <Michi pose="logo" size={s.face} title="" />
      </span>
      <span className="flex flex-col leading-none text-left">
        <span className={`${s.text} font-bold text-white tracking-tight`}>{APP_NAME}</span>
        {tagline && <span className="text-[11px] text-white/60 font-medium mt-1">{APP_TAGLINE}</span>}
      </span>
    </span>
  );
}
