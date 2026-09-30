"use client";
import { useEffect, useState } from "react";
import { llamar } from "./api";

interface Estado { proveedor: string; modo_activo: string; modelo?: string }

export function IaEstado() {
  const [e, setE] = useState<Estado | null | undefined>(undefined);
  useEffect(() => { llamar<Estado>("/api/ia/estado").then((r) => setE(r.ok ? r.data : null)); }, []);
  if (e === undefined) return <span className="muted small">Comprobando la redacción con IA…</span>;
  if (e === null) return <span className="muted small">No pudimos consultar el estado de la IA.</span>;
  const ia = e.modo_activo === "ia";
  return (
    <div className={`note ${ia ? "note-ok" : "note-info"}`}>
      <strong>{ia ? "Redacción con IA activa" : "Redacción en modo plantilla"}</strong>
      {ia && e.modelo ? <> · modelo {e.modelo}</> : <> · sin clave de IA, el brief, las notas y las respuestas usan plantillas con los mismos datos.</>}
    </div>
  );
}
