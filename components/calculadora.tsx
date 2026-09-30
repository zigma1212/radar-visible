"use client";
import { useState } from "react";
import { parsearValor } from "@/lib/importar/facturas";

const cop = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

function num(s: string): number | null {
  if (!s.trim()) return null;
  const v = parsearValor(s);
  return v !== null && v >= 0 ? v : null;
}

/** Calculadora con campos vacíos a propósito: los números los pone quien la usa, nada viene inventado. */
export function Calculadora() {
  const [valor, setValor] = useState("");
  const [meses, setMeses] = useState("");
  const [costo, setCosto] = useState("");
  const v = num(valor);
  const m = num(meses);
  const c = num(costo);
  const listo = v !== null && m !== null;
  const total = listo ? v * m + (c ?? 0) : null;

  return (
    <section className="card grid gap-3 rise" aria-labelledby="calc-h">
      <div>
        <p className="eyebrow">Calculadora</p>
        <h2 id="calc-h" className="h2">¿Cuánto vale anticipar una renovación?</h2>
        <p className="muted small" style={{ marginTop: 4 }}>
          Sin números de ejemplo: pon los tuyos. Es el valor de lo que sigue después de renovar, más lo que costaría reponer esa cuenta con una nueva.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Campo id="c-valor" etiqueta="Valor mensual de la cuenta (COP)" valor={valor} set={setValor} />
        <Campo id="c-meses" etiqueta="Meses que suele durar una cuenta después de renovar" valor={meses} set={setMeses} />
        <Campo id="c-costo" etiqueta="Costo de conseguir una cuenta nueva (COP)" valor={costo} set={setCosto} />
      </div>
      <div className="card-flat" style={{ padding: 14 }} role="status" aria-live="polite">
        {total === null ? (
          <p className="display" style={{ fontSize: 22 }}>Pon tus números</p>
        ) : (
          <>
            <p className="display tnum" style={{ fontSize: 30, lineHeight: 1.1 }}>{cop.format(total)}</p>
            <p className="muted small" style={{ marginTop: 4 }}>
              {cop.format(v!)} × {m} {m === 1 ? "mes" : "meses"}{c !== null ? ` + ${cop.format(c)} de conseguir una cuenta nueva` : " (sin costo de cuenta nueva)"}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Campo({ id, etiqueta, valor, set }: { id: string; etiqueta: string; valor: string; set: (v: string) => void }) {
  return (
    <div className="grid gap-1">
      <label htmlFor={id} className="small" style={{ fontWeight: 600 }}>{etiqueta}</label>
      <input id={id} className="field" inputMode="numeric" autoComplete="off" value={valor} onChange={(e) => set(e.target.value)} placeholder="" />
    </div>
  );
}
