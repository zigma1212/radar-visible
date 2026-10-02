"use client";
import Link from "next/link";
import { useState } from "react";
import { llamar } from "./api";
import { ErrorNote, ModoTag } from "./ui";

export function GenerarNota({ cuentaId, empresa }: { cuentaId: string; empresa: string }) {
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "bloqueada">("idle");
  const [modo, setModo] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  async function generar() {
    setEstado("cargando"); setError(null);
    const r = await llamar<{ id: string; modo: string; nota: { evidencia_disponible: boolean } }>("/api/notas", { method: "POST", json: { cuenta_id: cuentaId } });
    if (r.ok) { setModo(r.data.modo); setEstado(r.data.nota?.evidencia_disponible === true ? "ok" : "bloqueada"); } else { setError(r.error); setEstado("idle"); }
  }

  return (
    <div className="grid gap-3">
      <button className="btn btn-primary" onClick={generar} disabled={estado === "cargando"}>
        {estado === "cargando" ? <><span className="spinner" aria-hidden="true" /> Armando la nota…</> : "Generar nota de avance"}
      </button>
      {error ? <ErrorNote>{error}</ErrorNote> : null}
      {estado === "ok" || estado === "bloqueada" ? (
        <div className={`note ${estado === "bloqueada" ? "note-err" : "note-ok"} grid gap-2`} role="status">
          <span>{estado === "bloqueada" ? `Nota bloqueada para ${empresa}: falta evidencia. Revisa los datos y genera una nueva; no se puede aprobar.` : `Borrador listo para ${empresa}. Nada sale hasta que el brand manager lo apruebe.`} <ModoTag modo={modo} /></span>
          <Link className="btn btn-lime btn-sm" href="/bandeja" style={{ justifySelf: "start" }}>Abrir en la bandeja →</Link>
        </div>
      ) : null}
    </div>
  );
}
