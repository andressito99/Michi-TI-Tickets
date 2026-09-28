import { getInitials } from "../../utils/ticketUtils";

// Paleta de avatares: el color se deriva del nombre para que sea estable
const AVATAR_COLORS = [
  "bg-[#1f6fe5]", "bg-[#0e9f6e]", "bg-[#d97706]", "bg-[#7c3aed]",
  "bg-[#db2777]", "bg-[#0891b2]", "bg-[#ea580c]", "bg-[#4f46e5]",
];

const SIZES = {
  xs: "w-5 h-5 text-[9px]",
  sm: "w-6 h-6 text-[10px]",
  md: "w-8 h-8 text-xs",
  lg: "w-10 h-10 text-sm",
};

function colorFor(name = "") {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export function Avatar({ name, size = "sm", className = "", ring = false }) {
  const empty = !name || name === "Sin asignar";
  return (
    <span
      title={name || "Sin asignar"}
      className={`inline-flex items-center justify-center rounded-full font-semibold flex-shrink-0 select-none
        ${SIZES[size]} ${empty ? "bg-line-strong text-muted" : `${colorFor(name)} text-white`} ${ring ? "ring-2 ring-surface" : ""} ${className}`}
    >
      {empty ? "?" : getInitials(name)}
    </span>
  );
}
