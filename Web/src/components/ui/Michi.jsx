// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 andressito99 y los colaboradores del proyecto Michi · Soporte TI con siete vidas

// Michi, la mascota de la app: un gato naranja dibujado en SVG con varias poses.
// Las animaciones (cola, parpadeo, saludo…) están en index.css y respetan "reducir movimiento".

const C = {
  fur:    "#F4A340",
  dark:   "#DB7A24",
  cream:  "#FFF4E2",
  pink:   "#F59CB0",
  ink:    "#2B2D42",
  blush:  "#F7867D",
  shadow: "#0B2C5F",
};

// ── Cara ────────────────────────────────────────────────────
function Eyes({ mood }) {
  const stroke = { stroke: C.ink, strokeWidth: 3.5, strokeLinecap: "round", fill: "none" };
  if (mood === "happy") {
    return <g><path d="M75 80 Q82 71 89 80" {...stroke} /><path d="M111 80 Q118 71 125 80" {...stroke} /></g>;
  }
  if (mood === "sleep") {
    return <g><path d="M75 78 Q82 85 89 78" {...stroke} /><path d="M111 78 Q118 85 125 78" {...stroke} /></g>;
  }
  const up = mood === "up" ? -3 : 0;
  return (
    <g className="michi-blink">
      <ellipse cx="82" cy={78 + up} rx="6.5" ry="8" fill={C.ink} />
      <ellipse cx="118" cy={78 + up} rx="6.5" ry="8" fill={C.ink} />
      <circle cx="84.5" cy={74.5 + up} r="2.4" fill="#fff" />
      <circle cx="120.5" cy={74.5 + up} r="2.4" fill="#fff" />
      {mood === "sad" && (
        <g stroke={C.ink} strokeWidth="3" strokeLinecap="round">
          <path d="M73 67 L88 61" /><path d="M127 67 L112 61" />
        </g>
      )}
    </g>
  );
}

function Mouth({ mood }) {
  if (mood === "open") return <path d="M91 96 Q100 110 109 96 Z" fill="#B33A4A" stroke={C.ink} strokeWidth="2" strokeLinejoin="round" />;
  if (mood === "sad")  return <path d="M92 100 Q100 94 108 100" stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
  return <path d="M100 92 v3 M100 95 Q95 100 91 96 M100 95 Q105 100 109 96" stroke={C.ink} strokeWidth="2.2" fill="none" strokeLinecap="round" />;
}

function Head({ eyes = "open", mouth = "smile" }) {
  return (
    <g>
      {/* Orejas */}
      <path d="M55 64 L60 19 Q62 14 67 18 L94 42 Z" fill={C.fur} />
      <path d="M145 64 L140 19 Q138 14 133 18 L106 42 Z" fill={C.fur} />
      <path d="M63 52 L65 29 L83 44 Z" fill={C.pink} />
      <path d="M137 52 L135 29 L117 44 Z" fill={C.pink} />
      {/* Cabeza */}
      <ellipse cx="100" cy="80" rx="51" ry="43" fill={C.fur} />
      <g stroke={C.dark} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M91 40 Q94 48 91 55" /><path d="M100 38 v16" /><path d="M109 40 Q106 48 109 55" />
        <path d="M51 80 h9" /><path d="M149 80 h-9" />
      </g>
      {/* Hocico y mejillas */}
      <ellipse cx="86" cy="96" rx="16" ry="12" fill={C.cream} />
      <ellipse cx="114" cy="96" rx="16" ry="12" fill={C.cream} />
      <ellipse cx="100" cy="104" rx="14" ry="8" fill={C.cream} />
      <circle cx="68" cy="92" r="6.5" fill={C.blush} opacity=".35" />
      <circle cx="132" cy="92" r="6.5" fill={C.blush} opacity=".35" />
      <g stroke={C.ink} strokeWidth="1.5" strokeLinecap="round" opacity=".35">
        <path d="M72 95 L50 91" /><path d="M72 100 L50 102" />
        <path d="M128 95 L150 91" /><path d="M128 100 L150 102" />
      </g>
      <Eyes mood={eyes} />
      <path d="M95 87 Q100 84 105 87 Q100 94 95 87 Z" fill={C.pink} />
      <Mouth mood={mouth} />
    </g>
  );
}

function Paw({ cx, cy, rx = 13, ry = 9 }) {
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={C.cream} />
      <path d={`M${cx - 4} ${cy - ry + 3} v5 M${cx + 4} ${cy - ry + 3} v5`} stroke={C.dark} strokeWidth="1.6" strokeLinecap="round" opacity=".5" />
    </g>
  );
}

// ── Cuerpo sentado ──────────────────────────────────────────
function Body({ feet = true }) {
  return (
    <g>
      <g className="michi-tail">
        <path d="M130 166 C166 168 182 140 168 114" stroke={C.fur} strokeWidth="15" strokeLinecap="round" fill="none" />
        <path d="M172 128 C171 121 170 118 168 114" stroke={C.dark} strokeWidth="15" strokeLinecap="round" fill="none" />
      </g>
      <path d="M61 178 C55 140 70 108 100 108 C130 108 145 140 139 178 Z" fill={C.fur} />
      <path d="M83 178 C79 150 88 128 100 128 C112 128 121 150 117 178 Z" fill={C.cream} />
      <g stroke={C.dark} strokeWidth="4" strokeLinecap="round" fill="none">
        <path d="M64 146 q9 3 14 -2" /><path d="M62 160 q9 3 15 -2" />
        <path d="M136 146 q-9 3 -14 -2" /><path d="M138 160 q-9 3 -15 -2" />
      </g>
      {feet && <><Paw cx={82} cy={178} rx={15} ry={8} /><Paw cx={118} cy={178} rx={15} ry={8} /></>}
    </g>
  );
}

function Shadow() {
  return <ellipse cx="100" cy="185" rx="64" ry="7" fill={C.shadow} opacity=".1" />;
}

// ── Accesorios ──────────────────────────────────────────────
function Headset() {
  return (
    <g>
      <path d="M50 76 Q100 -6 150 76" stroke={C.ink} strokeWidth="6" fill="none" strokeLinecap="round" />
      <rect x="41" y="66" width="16" height="26" rx="7" fill={C.ink} />
      <rect x="143" y="66" width="16" height="26" rx="7" fill={C.ink} />
      <path d="M48 90 Q52 114 78 113" stroke={C.ink} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <circle cx="81" cy="113" r="5" fill="#1F6FE5" />
    </g>
  );
}

function WaveArm() {
  return (
    <g className="michi-wave">
      <path d="M132 132 Q162 126 168 98" stroke={C.fur} strokeWidth="17" strokeLinecap="round" fill="none" />
      <Paw cx={168} cy={92} rx={12} ry={11} />
    </g>
  );
}

function Laptop() {
  return (
    <g>
      <rect x="58" y="126" width="84" height="52" rx="7" fill="#CFD8E3" />
      <rect x="58" y="126" width="84" height="52" rx="7" fill="url(#michi-lid)" />
      <path d="M94 150 a6 6 0 1 1 12 0 a6 6 0 1 1 -12 0 M91 143 a2.5 2.5 0 1 1 5 0 a2.5 2.5 0 1 1 -5 0 M104 143 a2.5 2.5 0 1 1 5 0 a2.5 2.5 0 1 1 -5 0" fill="#fff" opacity=".85" />
      <rect x="46" y="176" width="108" height="7" rx="3.5" fill="#9AA7B8" />
      <g className="michi-type"><Paw cx={74} cy={128} rx={12} ry={8} /></g>
      <g className="michi-type michi-type-2"><Paw cx={126} cy={128} rx={12} ry={8} /></g>
    </g>
  );
}

function Magnifier() {
  return (
    <g className="michi-wave">
      <path d="M132 132 Q148 128 146 116" stroke={C.fur} strokeWidth="16" strokeLinecap="round" fill="none" />
      <path d="M148 112 L160 96" stroke={C.ink} strokeWidth="6" strokeLinecap="round" />
      <circle cx="170" cy="82" r="19" fill="#DCEBFF" fillOpacity=".75" stroke={C.ink} strokeWidth="5" />
      <path d="M160 74 q4 -6 11 -6" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
      <Paw cx={146} cy={114} rx={11} ry={10} />
    </g>
  );
}

function Zzz() {
  return (
    <g fill="#5E6C84" fontFamily="Inter, sans-serif" fontWeight="800">
      <text className="michi-z" x="146" y="44" fontSize="22">Z</text>
      <text className="michi-z michi-z-2" x="166" y="24" fontSize="15">z</text>
      <text className="michi-z michi-z-3" x="180" y="10" fontSize="11">z</text>
    </g>
  );
}

function Cushion() {
  return (
    <g>
      <ellipse cx="100" cy="182" rx="80" ry="13" fill="#D6E6FD" />
      <ellipse cx="100" cy="178" rx="74" ry="9" fill="#E8F1FE" />
    </g>
  );
}

function Confetti() {
  const bits = [
    [30, 40, "#1F6FE5", 0], [168, 34, "#16A34A", 1], [44, 118, "#DB2777", 2], [160, 128, "#F4A340", 0],
    [22, 84, "#F4A340", 1], [182, 78, "#1F6FE5", 2], [70, 14, "#16A34A", 2], [132, 12, "#DB2777", 1],
  ];
  return bits.map(([x, y, color, d], i) => (
    <rect key={i} className={`michi-confetti michi-delay-${d}`} x={x} y={y} width="8" height="4" rx="2" fill={color}
      transform={`rotate(${i * 37} ${x + 4} ${y + 2})`} />
  ));
}

function ArmsUp() {
  return (
    <g className="michi-cheer">
      <path d="M68 132 Q38 126 32 98" stroke={C.fur} strokeWidth="17" strokeLinecap="round" fill="none" />
      <path d="M132 132 Q162 126 168 98" stroke={C.fur} strokeWidth="17" strokeLinecap="round" fill="none" />
      <Paw cx={32} cy={92} rx={12} ry={11} />
      <Paw cx={168} cy={92} rx={12} ry={11} />
    </g>
  );
}

function Clock() {
  return (
    <g className="michi-z">
      <circle cx="162" cy="36" r="18" fill="#fff" stroke={C.ink} strokeWidth="4" />
      <path d="M162 26 v10 l7 5" stroke={C.ink} strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <circle cx="140" cy="62" r="4" fill="#fff" stroke={C.ink} strokeWidth="2" />
      <circle cx="132" cy="74" r="2.5" fill="#fff" stroke={C.ink} strokeWidth="1.5" />
    </g>
  );
}

function SweatDrop() {
  return <path d="M146 52 q8 12 0 17 q-8 -5 0 -17 Z" fill="#8EC5FF" />;
}

// ── Poses ───────────────────────────────────────────────────
const POSES = {
  sit:       { viewBox: "0 0 200 200", body: true,  eyes: "open" },
  wave:      { viewBox: "0 0 200 200", body: true,  eyes: "happy", extra: <WaveArm /> },
  headset:   { viewBox: "0 0 200 200", body: true,  eyes: "happy", extra: <WaveArm />, overHead: <Headset /> },
  laptop:    { viewBox: "0 0 200 200", body: true,  feet: false, eyes: "open", front: <Laptop /> },
  magnifier: { viewBox: "0 0 210 200", body: true,  eyes: "up", extra: <Magnifier /> },
  sleep:     { viewBox: "0 0 200 200", body: true,  eyes: "sleep", under: <Cushion />, overHead: <Zzz />, tilt: -6 },
  celebrate: { viewBox: "0 0 200 200", body: true,  eyes: "happy", mouth: "open", extra: <ArmsUp />, behind: <Confetti /> },
  wait:      { viewBox: "0 0 200 200", body: true,  eyes: "up", overHead: <Clock /> },
  sad:       { viewBox: "0 0 200 200", body: true,  eyes: "sad", mouth: "sad", overHead: <SweatDrop /> },
  peek:      { viewBox: "30 10 140 124", body: false, eyes: "open", peek: true },
  head:      { viewBox: "38 12 124 116", body: false, eyes: "happy", noShadow: true },
  // Logo: cara con auriculares de soporte, encuadre cuadrado y centrado
  logo:      { viewBox: "33 3 134 134", body: false, eyes: "happy", noShadow: true, overHead: <Headset /> },
};

/**
 * @param {"sit"|"wave"|"headset"|"laptop"|"magnifier"|"sleep"|"celebrate"|"wait"|"sad"|"peek"|"head"|"logo"} pose
 */
export function Michi({ pose = "sit", size = 160, className = "", title }) {
  const p = POSES[pose] ?? POSES.sit;
  const label = title ?? "Michi, el gato de soporte";
  return (
    <svg
      viewBox={p.viewBox} width={size} height={size} className={`michi ${className}`}
      role="img" aria-label={label} xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="michi-lid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1F6FE5" stopOpacity=".95" />
          <stop offset="1" stopColor="#0B2C5F" stopOpacity=".95" />
        </linearGradient>
      </defs>
      {p.behind}
      {p.body && !p.noShadow && !p.under && <Shadow />}
      {p.under}
      {p.body && <Body feet={p.feet !== false} />}
      {p.extra}
      <g transform={p.tilt ? `rotate(${p.tilt} 100 90)` : undefined}>
        <Head eyes={p.eyes} mouth={p.mouth} />
      </g>
      {p.overHead}
      {p.front}
      {p.peek && <><Paw cx={78} cy={122} rx={14} ry={9} /><Paw cx={122} cy={122} rx={14} ry={9} /></>}
    </svg>
  );
}
