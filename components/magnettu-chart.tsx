import type { Metricas } from "@/lib/tipos";
import { fechaCorta, n, pct } from "./format";

const W = 340;

function Barras({ datos, etiquetas }: { datos: number[]; etiquetas: string[] }) {
  const H = 110;
  const max = Math.max(...datos, 1);
  const bw = (W - 16) / datos.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" role="img" aria-label={`Impresiones por semana, de ${n(datos[0])} a ${n(datos[datos.length - 1])}`}>
      <line x1="8" x2={W - 8} y1={H} y2={H} stroke="#ddd6c6" />
      {datos.map((v, i) => {
        const h = (v / max) * (H - 14);
        return (
          <g key={i}>
            <rect x={8 + i * bw + 3} y={H - h} width={Math.max(bw - 6, 4)} height={h} rx="4" fill={i === datos.length - 1 ? "#2b1a66" : "#a99ad9"}>
              <title>{`${etiquetas[i]}: ${n(v)} impresiones`}</title>
            </rect>
          </g>
        );
      })}
      <text x="8" y={H + 16} fontSize="10.5" fill="#4b4466">{etiquetas[0]}</text>
      <text x={W - 8} y={H + 16} fontSize="10.5" fill="#4b4466" textAnchor="end">{etiquetas[etiquetas.length - 1]}</text>
      <text x={W - 8} y="12" fontSize="10.5" fill="#4b4466" textAnchor="end">máx. {n(max)}</text>
    </svg>
  );
}

function Linea({ datos, etiquetas }: { datos: number[]; etiquetas: string[] }) {
  const H = 90;
  const max = Math.max(...datos, 0.01);
  const min = Math.min(...datos, 0);
  const x = (i: number) => 14 + (datos.length === 1 ? (W - 28) / 2 : (i / (datos.length - 1)) * (W - 28));
  const y = (v: number) => H - 10 - ((v - min) / (max - min || 1)) * (H - 30);
  const d = datos.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} width="100%" role="img" aria-label={`Porcentaje fuera de su red, de ${pct(datos[0])} a ${pct(datos[datos.length - 1])}`}>
      <line x1="8" x2={W - 8} y1={H} y2={H} stroke="#ddd6c6" />
      <path d={d} fill="none" stroke="#1d6a43" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {datos.map((v, i) => (
        <circle key={i} cx={x(i)} cy={y(v)} r={i === datos.length - 1 ? 5 : 3} fill="#1d6a43" stroke="#fff" strokeWidth="1.5">
          <title>{`${etiquetas[i]}: ${pct(v)} fuera de su red`}</title>
        </circle>
      ))}
      <text x="8" y={H + 16} fontSize="10.5" fill="#4b4466">{etiquetas[0]}</text>
      <text x={W - 8} y={H + 16} fontSize="10.5" fill="#4b4466" textAnchor="end">{etiquetas[etiquetas.length - 1]}</text>
    </svg>
  );
}

export function MagnettuChart({ m }: { m: Metricas }) {
  const serie = m.serie_semanal.slice(-12);
  const et = serie.map((s) => fechaCorta(s.semana));
  return (
    <div className="grid gap-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <Dato v={n(m.toques_acumulados)} l="publicaciones acumuladas" />
        <Dato v={n(m.alcance_fuera_de_red_total)} l="vistas fuera de su red" />
        <Dato v={n(m.conversaciones_total)} l="conversaciones abiertas" />
      </div>
      <div>
        <p className="eyebrow">Impresiones por semana</p>
        <Barras datos={serie.map((s) => s.impresiones)} etiquetas={et} />
      </div>
      <div>
        <p className="eyebrow">% de alcance fuera de su red</p>
        <p className="small muted">Pasó de {pct(m.pct_fuera_de_red_inicial)} a {pct(m.pct_fuera_de_red_actual)}: lo que no se ve en impresiones sí está creciendo.</p>
        <Linea datos={serie.map((s) => s.pct_fuera_de_red)} etiquetas={et} />
      </div>
    </div>
  );
}

function Dato({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <div className="display tnum" style={{ fontSize: 26, fontWeight: 600, lineHeight: 1 }}>{v}</div>
      <div className="small muted" style={{ marginTop: 4, lineHeight: 1.25 }}>{l}</div>
    </div>
  );
}
