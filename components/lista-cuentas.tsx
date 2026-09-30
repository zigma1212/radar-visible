"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CuentaEvaluada, Senal } from "@/lib/tipos";
import { ORDEN_SEMAFORO, cop } from "./format";
import { SemaforoPill } from "./ui";

type Filtro = "todas" | "rojas" | "ambar" | "sin_lectura" | "plana";
const FILTROS: { id: Filtro; label: string; test: (c: CuentaEvaluada) => boolean }[] = [
  { id: "todas", label: "Todas", test: () => true },
  { id: "rojas", label: "Prioridad esta semana", test: (c) => c.semaforo === "rojo" },
  { id: "ambar", label: "Mirar de cerca", test: (c) => c.semaforo === "ambar" },
  { id: "sin_lectura", label: "Sin lectura", test: (c) => c.semaforo === "sin_lectura" },
  { id: "plana", label: "Parte plana", test: (c) => c.zona === "parte plana" },
];

export function razonPrincipal(c: CuentaEvaluada): string {
  const orden: Senal["severidad"][] = ["riesgo", "atencion", "sin_lectura"];
  for (const sev of orden) {
    const s = c.senales.find((x) => x.severidad === sev);
    if (s) return s.explicacion;
  }
  return "Sin alertas: todas las señales leídas están dentro de lo esperado.";
}

const ZONA_LABEL = { onboarding: "Onboarding", "parte plana": "Parte plana", "tracción": "Tracción" } as const;

export function ListaCuentas({ cuentas, inicial }: { cuentas: CuentaEvaluada[]; inicial: Filtro }) {
  const [f, setF] = useState<Filtro>(inicial);
  const ordenadas = useMemo(
    () => [...cuentas].sort((a, b) => ORDEN_SEMAFORO[a.semaforo] - ORDEN_SEMAFORO[b.semaforo] || b.fee_mensual_cop - a.fee_mensual_cop),
    [cuentas],
  );
  const filtro = FILTROS.find((x) => x.id === f)!;
  const lista = ordenadas.filter(filtro.test);

  return (
    <div className="grid gap-4">
      <div className="filters" role="group" aria-label="Filtrar cuentas">
        {FILTROS.map((x) => (
          <button key={x.id} className="fbtn" aria-pressed={f === x.id} onClick={() => setF(x.id)}>
            {x.label} <span className="n tnum">{cuentas.filter(x.test).length}</span>
          </button>
        ))}
      </div>

      {lista.length === 0 ? <div className="card empty muted">Ninguna cuenta en este filtro.</div> : null}

      <ul className="grid gap-3 md:hidden" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {lista.map((c) => (
          <li key={c.id}>
            <Link href={`/cuentas/${c.id}`} className={`card acc-card acc-${c.semaforo}`}>
              <div className="top">
                <div>
                  <div className="acc-name">{c.empresa}</div>
                  <div className="small muted">{c.cliente} · {c.cargo}</div>
                </div>
                <SemaforoPill s={c.semaforo} />
              </div>
              <div className="small muted">
                {c.brand_manager.nombre} · mes {c.mes_programa} · {ZONA_LABEL[c.zona]} · {cop(c.fee_mensual_cop)}/mes
              </div>
              <div style={{ fontSize: 14.5 }}>{razonPrincipal(c)}</div>
              {c.accion ? <div><span className="chip chip-lime">{c.accion.titulo} · {c.accion.dueno_nombre}</span></div> : null}
            </Link>
          </li>
        ))}
      </ul>

      <div className="card hidden md:block" style={{ padding: 0, overflow: "hidden" }}>
        <table className="tbl">
          <caption className="sr-only">Cuentas con semáforo</caption>
          <thead>
            <tr>
              <th scope="col">Empresa</th>
              <th scope="col">Brand manager</th>
              <th scope="col">Mes / zona</th>
              <th scope="col">Semáforo</th>
              <th scope="col">Por qué</th>
              <th scope="col">Acción</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c) => (
              <tr key={c.id}>
                <td>
                  <Link className="rowlink" href={`/cuentas/${c.id}`}>{c.empresa}</Link>
                  <div className="small muted">{c.cliente}</div>
                </td>
                <td>{c.brand_manager.nombre}</td>
                <td className="tnum">Mes {c.mes_programa}<div className="small muted">{ZONA_LABEL[c.zona]}</div></td>
                <td><SemaforoPill s={c.semaforo} /></td>
                <td style={{ maxWidth: 340 }}>{razonPrincipal(c)}</td>
                <td>{c.accion ? <span className="chip chip-lime">{c.accion.titulo}</span> : <span className="muted">—</span>}{c.accion ? <div className="small muted" style={{ marginTop: 4 }}>{c.accion.dueno_nombre}</div> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
