import Link from "next/link";
import type { Semaforo } from "@/lib/tipos";
import { ORDEN_SEMAFORO } from "./format";

export interface Punto {
  id: string;
  etiqueta: string;
  mes: number;
  semaforo: Semaforo;
  href?: string;
}

const W = 360;
const H = 210;
const PL = 10;
const PR = 10;
const PT = 16;
const PB = 30;
const K = 3.1;
const MESES = 12;

const xDe = (m: number) => PL + ((m - 0.5) / MESES) * (W - PL - PR);
const yDe = (m: number) => {
  const t = (m - 0.5) / MESES;
  const f = (Math.exp(K * t) - 1) / (Math.exp(K) - 1);
  return H - PB - f * (H - PB - PT - 14);
};

const COLOR: Record<Semaforo, { fill: string; stroke: string }> = {
  rojo: { fill: "var(--rojo)", stroke: "#fff" },
  ambar: { fill: "var(--ambar-fill)", stroke: "#fff" },
  verde: { fill: "var(--verde)", stroke: "#fff" },
  sin_lectura: { fill: "#fff", stroke: "var(--nolectura)" },
};

/** La curva del interés compuesto, con la parte plana (meses 2 a 5) y las cuentas ubicadas por mes de programa. */
export function Curva({ puntos, destacado }: { puntos: Punto[]; destacado?: string }) {
  const pts: string[] = [];
  for (let i = 0; i <= 96; i++) {
    const m = 0.5 + (i / 96) * MESES;
    pts.push(`${xDe(m).toFixed(1)},${yDe(m).toFixed(1)}`);
  }
  const linea = "M" + pts.join(" L");
  const area = `${linea} L${xDe(12.5)},${H - PB} L${xDe(0.5)},${H - PB} Z`;

  const porMes = new Map<number, Punto[]>();
  for (const p of puntos) {
    const m = Math.min(Math.max(p.mes, 1), 12);
    porMes.set(m, [...(porMes.get(m) ?? []), p]);
  }
  const dots: { p: Punto; cx: number; cy: number }[] = [];
  for (const [m, lista] of porMes) {
    lista.sort((a, b) => ORDEN_SEMAFORO[a.semaforo] - ORDEN_SEMAFORO[b.semaforo]);
    const arriba = m <= 6;
    lista.forEach((p, i) => {
      const paso = 11.5;
      const cy = yDe(m) + (arriba ? -(9 + i * paso) : 9 + i * paso);
      dots.push({ p, cx: xDe(m), cy });
    });
  }

  const bx1 = xDe(1.5);
  const bx2 = xDe(5.5);
  return (
    <svg className="curve" viewBox={`0 0 ${W} ${H}`} role="img" width="100%" aria-label="Curva del interés compuesto. La parte plana va de los meses 2 al 5. Cada punto es una cuenta ubicada por su mes de programa.">
      <defs>
        <linearGradient id="curvaArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4a35a0" stopOpacity="0.22" />
          <stop offset="1" stopColor="#4a35a0" stopOpacity="0.02" />
        </linearGradient>
        <pattern id="plana" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="7" height="7" fill="#d8f24a" fillOpacity="0.38" />
          <rect width="2" height="7" fill="#b9d61c" fillOpacity="0.55" />
        </pattern>
      </defs>
      <rect x={bx1} y={PT - 6} width={bx2 - bx1} height={H - PB - PT + 6} rx="10" fill="url(#plana)" />
      <text x={(bx1 + bx2) / 2} y={PT + 6} textAnchor="middle" fontSize="11" fontWeight="800" fill="#2b1a66" letterSpacing="0.06em">
        PARTE PLANA
      </text>
      <path d={area} fill="url(#curvaArea)" />
      <path className="draw" d={linea} fill="none" stroke="#2b1a66" strokeWidth="3" strokeLinecap="round" />
      <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="#ddd6c6" />
      {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
        <text key={m} x={xDe(m)} y={H - PB + 15} textAnchor="middle" fontSize="10.5" fill="#4b4466" fontWeight={m >= 2 && m <= 5 ? 800 : 500}>
          {m === 12 ? "12+" : m}
        </text>
      ))}
      <text x={W / 2} y={H - 3} textAnchor="middle" fontSize="10" fill="#4b4466">
        mes del programa
      </text>
      <text x={xDe(11.6)} y={yDe(12) - 20} textAnchor="end" fontSize="10" fill="#4b4466" fontStyle="italic">
        tracción
      </text>
      {dots.map(({ p, cx, cy }) => {
        const c = COLOR[p.semaforo];
        const esD = destacado === p.id;
        const nodo = (
          <g>
            <title>{`${p.etiqueta}: mes ${p.mes}`}</title>
            {esD ? <circle cx={cx} cy={cy} r="13" fill="none" stroke="#2b1a66" strokeWidth="2" strokeDasharray="3 3" /> : null}
            <circle cx={cx} cy={cy} r={esD ? 7.5 : 4.8} fill={c.fill} stroke={c.stroke} strokeWidth={p.semaforo === "sin_lectura" ? 2 : 1.6} strokeDasharray={p.semaforo === "sin_lectura" ? "2.5 2" : undefined} />
          </g>
        );
        return p.href ? (
          <Link key={p.id} href={p.href} aria-label={`${p.etiqueta}, mes ${p.mes}`}>
            {nodo}
          </Link>
        ) : (
          <g key={p.id}>{nodo}</g>
        );
      })}
    </svg>
  );
}

export function LeyendaCurva({ conteo }: { conteo: Record<Semaforo, number> }) {
  const items: [Semaforo, string][] = [["rojo", "Prioridad esta semana"], ["ambar", "Mirar de cerca"], ["verde", "Avanzando"], ["sin_lectura", "Sin lectura"]];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 small muted" style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {items.map(([k, l]) => (
        <li key={k} className="flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" fill={COLOR[k].fill} stroke={k === "sin_lectura" ? "var(--nolectura)" : "none"} strokeWidth="1.6" strokeDasharray={k === "sin_lectura" ? "2 1.6" : undefined} />
          </svg>
          {l} <strong className="tnum">{conteo[k]}</strong>
        </li>
      ))}
    </ul>
  );
}
