// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Botón del menú lateral. Contraído: solo icono con tooltip. Expandido: icono + texto.
export function NavItem({ label, Icon, active, badge, onClick, expanded }) {
  const hasBadge = badge != null && badge > 0;
  return (
    <button
      onClick={onClick}
      title={expanded ? undefined : label}
      aria-label={label}
      className={`group relative h-11 rounded-xl flex items-center transition-colors ${
        expanded ? "w-full px-3 gap-3" : "w-11 justify-center"
      } ${active ? "bg-white/12 text-accent" : "text-white/70 hover:bg-white/8 hover:text-white"}`}
    >
      {active && <span className={`absolute top-2 bottom-2 w-1 rounded-r bg-accent ${expanded ? "-left-3" : "-left-2"}`} />}
      <Icon size={20} strokeWidth={active ? 2.25 : 2} className="flex-shrink-0" />

      {expanded && (
        <span className={`flex-1 text-left text-sm truncate ${active ? "font-semibold text-white" : "font-medium"}`}>
          {label}
        </span>
      )}

      {hasBadge && (
        expanded ? (
          <span className="min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-[10px] font-bold leading-5 text-center">
            {badge > 99 ? "99+" : badge}
          </span>
        ) : (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-danger text-white text-[9px] font-bold leading-4 text-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )
      )}

      {!expanded && (
        <span className="pointer-events-none absolute left-full ml-3 px-2 py-1 rounded-md bg-ink text-surface text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 shadow-lg">
          {label}
        </span>
      )}
    </button>
  );
}
