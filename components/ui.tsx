import type { ReactNode } from "react";
import type { FuenteId, Semaforo, Severidad } from "@/lib/tipos";
import { FUENTE_NOMBRE, SEMAFORO_LABEL, fechaHora } from "./format";

export function Logo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2 19c6 0 8-1.5 10.5-5.5S17 5 22 4" stroke="#2b1a66" strokeWidth="2.6" strokeLinecap="round" />
      <circle cx="12.5" cy="13.5" r="2.4" fill="#2b1a66" />
    </svg>
  );
}

export function SemaforoPill({ s, texto }: { s: Semaforo | Severidad; texto?: string }) {
  const clave = (s === "ok" ? "verde" : s === "atencion" ? "ambar" : s === "riesgo" ? "rojo" : s) as Semaforo;
  return (
    <span className={`pill p-${clave}`}>
      <i aria-hidden="true" />
      {texto ?? SEMAFORO_LABEL[clave]}
    </span>
  );
}

export const SEVERIDAD_LABEL: Record<Severidad, string> = {
  ok: "Bien",
  atencion: "Mirar de cerca",
  riesgo: "Prioridad",
  sin_lectura: "Sin lectura",
};

export function ModoTag({ modo }: { modo?: string }) {
  const ia = modo === "ia";
  return <span className={`tag ${ia ? "tag-ia" : "tag-plantilla"}`}>{ia ? "Redactado con IA" : "Plantilla"}</span>;
}

/** Fuente + fecha de lectura, siempre visibles junto a cada señal. */
export function FuenteLectura({ fuente, leido_en }: { fuente: FuenteId | string; leido_en: string | null }) {
  return (
    <span>
      Fuente: <strong>{FUENTE_NOMBRE[fuente] ?? fuente}</strong>
      {" · "}
      {leido_en ? <>leído {fechaHora(leido_en)}</> : <>sin fecha de lectura</>}
    </span>
  );
}

const ICONOS: Record<string, ReactNode> = {
  notion: <path d="M4 5h16v14H4zM8 10l2.5 2.5L16 7" />,
  circleback: <path d="M4 6h16v10H9l-4 3v-3H4z" />,
  magnettu: <path d="M5 19V11M12 19V5M19 19v-6" />,
  siigo: <path d="M6 3h12v18l-3-2-3 2-3-2-3 2zM9 8h6M9 12h6" />,
  pipedrive: <path d="M4 12a8 8 0 0 1 14-5l2-2v6h-6l2-2a5 5 0 0 0-9 3M20 12a8 8 0 0 1-14 5l-2 2v-6h6l-2 2a5 5 0 0 0 9-3" />,
  slack: <path d="M9 3L7 21M17 3l-2 18M4 9h17M3 15h17" />,
};

export function FuenteIcon({ fuente, size = 20 }: { fuente: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONOS[fuente] ?? <circle cx="12" cy="12" r="7" />}
    </svg>
  );
}

export function Kpi({ valor, etiqueta, clase, sub }: { valor: string; etiqueta: string; clase: string; sub?: string }) {
  return (
    <div className={`kpi ${clase}`}>
      <div className="v tnum">{valor}</div>
      <div className="l">{etiqueta}</div>
      {sub ? <div className="l small" style={{ marginTop: 2 }}>{sub}</div> : null}
    </div>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return <div className="note note-err" role="alert">{children}</div>;
}
