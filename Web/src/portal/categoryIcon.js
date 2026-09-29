// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

import { Wifi, Monitor, AppWindow, KeyRound, Printer, Mail, Phone, ShieldAlert, Database, HelpCircle } from "lucide-react";

// Icono, color y explicación en lenguaje sencillo según palabras clave del nombre de la categoría
const RULES = [
  { match: /red|wifi|internet|conex|vpn/i,          Icon: Wifi,        tint: "bg-[#e8f1fe] text-[#1f5fc9] dark:bg-[#16294a] dark:text-[#8ab4f8]",
    desc: "Internet, Wi-Fi, cable de red o VPN que no conecta o va lento." },
  { match: /impres|escáner|scanner/i,               Icon: Printer,     tint: "bg-[#fff0e6] text-[#c2410c] dark:bg-[#3a2212] dark:text-[#fdba74]",
    desc: "Impresoras o escáneres que no imprimen, se atascan o no aparecen." },
  { match: /hard|equipo|pc|laptop|monitor|compu/i,  Icon: Monitor,     tint: "bg-[#f1ecfe] text-[#6d28d9] dark:bg-[#271b45] dark:text-[#c4b5fd]",
    desc: "El equipo físico: computadora, pantalla, teclado, ratón, impresora." },
  { match: /soft|program|aplica|sistema|app/i,      Icon: AppWindow,   tint: "bg-[#e5f6ec] text-[#13773a] dark:bg-[#12331f] dark:text-[#6fd39a]",
    desc: "Programas y aplicaciones: instalar, actualizar o errores al usarlos." },
  { match: /cuenta|contrase|acceso|usuario|login/i, Icon: KeyRound,    tint: "bg-[#fdf3e1] text-[#a15c07] dark:bg-[#3a2a10] dark:text-[#f5c26b]",
    desc: "Contraseñas olvidadas, cuentas bloqueadas o permisos de acceso." },
  { match: /correo|mail|outlook/i,                  Icon: Mail,        tint: "bg-[#e6f6fa] text-[#0e7490] dark:bg-[#10303a] dark:text-[#67e8f9]",
    desc: "Correo que no llega, no se envía o problemas con Outlook." },
  { match: /tel[eé]f|móvil|celular/i,               Icon: Phone,       tint: "bg-[#fdeaf3] text-[#be185d] dark:bg-[#3a1428] dark:text-[#f9a8d4]",
    desc: "Teléfonos de escritorio o móviles de la empresa." },
  { match: /segur|virus|malware/i,                  Icon: ShieldAlert, tint: "bg-[#fde8e8] text-[#b42318] dark:bg-[#3b1616] dark:text-[#f59b93]",
    desc: "Virus, correos sospechosos o cualquier cosa que parezca un riesgo." },
  { match: /datos|base|servidor/i,                  Icon: Database,    tint: "bg-[#eef2f8] text-[#334e7a] dark:bg-[#1a263c] dark:text-[#a9bddc]",
    desc: "Carpetas compartidas, archivos del servidor o bases de datos." },
];

const FALLBACK = { Icon: HelpCircle, tint: "bg-subtle text-muted", desc: null };

export const OTHER_CATEGORY = {
  Icon: HelpCircle,
  tint: "bg-subtle text-muted",
  desc: "¿No sabes dónde encaja? Elige esta opción y cuéntanos qué pasa.",
};

export function categoryStyle(name = "") {
  return RULES.find(r => r.match.test(name)) ?? FALLBACK;
}
