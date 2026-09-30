import { InView } from "./in-view";

const W = 720;
const H = 360;
const PL = 18;
const PR = 18;
const PT = 40;
const PB = 68;
const K = 3.1;
const MESES = 12;
const xDe = (m: number) => PL + ((m - 0.5) / MESES) * (W - PL - PR);
const yDe = (m: number) => {
  const t = (m - 0.5) / MESES;
  const f = (Math.exp(K * t) - 1) / (Math.exp(K) - 1);
  return H - PB - f * (H - PB - PT - 20);
};

/** Curva del interés compuesto para /diagnostico: se dibuja al entrar en vista. */
export function CurvaDx() {
  const pts: string[] = [];
  for (let i = 0; i <= 120; i++) {
    const m = 0.5 + (i / 120) * MESES;
    pts.push(`${xDe(m).toFixed(1)},${yDe(m).toFixed(1)}`);
  }
  const linea = "M" + pts.join(" L");
  const area = `${linea} L${xDe(12.5)},${H - PB} L${xDe(0.5)},${H - PB} Z`;
  const bx1 = xDe(1.5);
  const bx2 = xDe(5.5);
  const cx = (bx1 + bx2) / 2;
  return (
    <InView className="dx-curva-in">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Curva del interés compuesto: casi plana entre los meses 2 y 5, y luego sube con fuerza. La parte plana está sombreada.">
        <defs>
          <linearGradient id="dxArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2e1f6a" stopOpacity="0.16" />
            <stop offset="1" stopColor="#2e1f6a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect x={bx1} y={PT - 14} width={bx2 - bx1} height={H - PB - PT + 14} rx="10" fill="#e5f973" fillOpacity="0.55" />
        <text className="b1" x={cx} y={PT + 4} textAnchor="middle" fontSize="15" fontWeight="700" letterSpacing="1.6" fill="#2e1f6a">PARTE PLANA</text>
        <text className="b2" x={cx} y={PT + 32} textAnchor="middle" fontSize="13" fontWeight="500" fill="#2e1f6a">meses 2 a 5</text>
        <path d={area} fill="url(#dxArea)" className="dx-fade" />
        <line x1={PL} x2={W - PR} y1={H - PB} y2={H - PB} stroke="#c9c4dc" />
        {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
          <text key={m} x={xDe(m)} y={H - PB + 26} textAnchor="middle" fontSize="14" fill="#3d3a52" fontWeight={m >= 2 && m <= 5 ? 700 : 500}>
            {m === 12 ? "12+" : m}
          </text>
        ))}
        <text x={W / 2} y={H - 6} textAnchor="middle" fontSize="13" fill="#3d3a52" letterSpacing="1.2">MES DEL PROGRAMA</text>
        <path className="dx-line" pathLength={1} d={linea} fill="none" stroke="#2e1f6a" strokeWidth="4" strokeLinecap="round" />
        <circle className="dx-fade" cx={xDe(12)} cy={yDe(12)} r="7" fill="#8be0f4" stroke="#2e1f6a" strokeWidth="3" />
        <text className="dx-fade" x={xDe(11.5)} y={yDe(12) - 4} textAnchor="end" fontSize="14" fontStyle="italic" fill="#3d3a52">tracción</text>
      </svg>
    </InView>
  );
}
