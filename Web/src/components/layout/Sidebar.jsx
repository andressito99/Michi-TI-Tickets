import { useState } from "react";
import { LogOut, PanelLeftOpen, PanelLeftClose } from "lucide-react";
import { NavItem } from "./NavItem";

const STORAGE_KEY = "sidebarExpanded";

function readExpanded() {
  try { return localStorage.getItem(STORAGE_KEY) === "true"; } catch { return false; }
}

// Menú lateral: carril de iconos que se puede expandir para mostrar los nombres
export function Sidebar({ activeView, onNavigate, pendingCount, onLogout, navItems }) {
  const [expanded, setExpanded] = useState(readExpanded);

  const toggle = () => {
    setExpanded(prev => {
      try { localStorage.setItem(STORAGE_KEY, String(!prev)); } catch { /* sin almacenamiento */ }
      return !prev;
    });
  };

  return (
    <aside
      className={`bg-navy flex flex-col py-3 gap-1.5 flex-shrink-0 transition-[width] duration-200 ease-out ${
        expanded ? "w-56 px-3" : "w-16 items-center"
      }`}
    >
      {navItems.map(({ key, label, Icon, hasBadge }) => (
        <NavItem
          key={key} label={label} Icon={Icon} expanded={expanded}
          active={activeView === key}
          badge={hasBadge ? pendingCount : null}
          onClick={() => onNavigate(key)}
        />
      ))}

      <div className={`mt-auto flex flex-col gap-1.5 pt-3 border-t border-white/10 ${expanded ? "" : "items-center"}`}>
        <NavItem
          label={expanded ? "Contraer menú" : "Expandir menú"}
          Icon={expanded ? PanelLeftClose : PanelLeftOpen}
          expanded={expanded}
          onClick={toggle}
        />
        <NavItem label="Cerrar sesión" Icon={LogOut} expanded={expanded} onClick={onLogout} />
      </div>
    </aside>
  );
}
