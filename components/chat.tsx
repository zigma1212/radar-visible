"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { llamar } from "./api";
import { ErrorNote, ModoTag } from "./ui";
import { fechaCorta } from "./format";

interface Cita { fuente: string; fecha: string }
type CuentaRef = string | { id: string; empresa?: string };

/** "[Notion, 2026-10-05]" → "(Notion, 5 oct)": la fuente se lee sin formato técnico. */
const citasLegibles = (t: string) => t.replace(/\[([^\],\[]+), (\d{4}-\d{2}-\d{2})\]/g, (_, f: string, d: string) => `(${f}, ${fechaCorta(d)})`);
interface Respuesta { respuesta: string; citas: Cita[]; cuentas?: CuentaRef[]; modo: string }
interface Msg { rol: "user" | "bot"; texto: string; r?: Respuesta; error?: string }

const SUGERIDAS = ["¿Cómo va Andina Seguros?", "¿Qué cuentas necesitan que se vea lo acumulado?", "¿Quién está sobrecargado?"];

export function Chat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const fin = useRef<HTMLDivElement>(null);
  useEffect(() => { if (msgs.length) fin.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs, busy]);

  async function enviar(pregunta: string) {
    const t = pregunta.trim();
    if (!t || busy) return;
    setMsgs((m) => [...m, { rol: "user", texto: t }]);
    setQ(""); setBusy(true);
    const r = await llamar<Respuesta>("/api/preguntar", { method: "POST", json: { pregunta: t } });
    setMsgs((m) => [...m, r.ok ? { rol: "bot", texto: r.data.respuesta, r: r.data } : { rol: "bot", texto: "", error: r.error }]);
    setBusy(false);
  }

  return (
    <div className="grid gap-3">
      <div className="grid gap-3" aria-live="polite">
        {msgs.length === 0 ? (
          <div className="card grid gap-3">
            <p className="muted">Pregunta como se lo preguntarías a alguien del equipo. Cada dato viene con su fuente y su fecha; si no lo sabemos, lo decimos.</p>
          </div>
        ) : null}
        {msgs.map((m, i) =>
          m.rol === "user" ? (
            <div key={i} className="bubble b-user">{m.texto}</div>
          ) : (
            <div key={i} className="bubble b-bot grid gap-2">
              {m.error ? <ErrorNote>{m.error}</ErrorNote> : <p style={{ whiteSpace: "pre-line" }}>{citasLegibles(m.texto)}</p>}
              {m.r ? (
                <>
                  {m.r.citas?.length ? (
                    <div className="flex flex-wrap gap-2" aria-label="Fuentes citadas">
                      {m.r.citas.map((c, j) => <span key={j} className="chip chip-line">{c.fuente}, {fechaCorta(c.fecha)}</span>)}
                    </div>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    {(m.r.cuentas ?? []).map((c, j) => {
                      const id = typeof c === "string" ? c : c.id;
                      return <Link key={j} className="chip" href={`/cuentas/${id}`}>{typeof c === "string" ? `Ver cuenta ${c}` : `Ver ${c.empresa ?? id}`} →</Link>;
                    })}
                    <ModoTag modo={m.r.modo} />
                  </div>
                </>
              ) : null}
            </div>
          ),
        )}
        {busy ? <div className="bubble b-bot muted flex items-center gap-2" role="status"><span className="spinner" aria-hidden="true" /> Consultando las fuentes…</div> : null}
        <div ref={fin} />
      </div>

      <div className="composer grid gap-2">
        <div className="filters">
          {SUGERIDAS.map((s) => <button key={s} className="fbtn" onClick={() => enviar(s)} disabled={busy}>{s}</button>)}
        </div>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); enviar(q); }}>
          <label className="sr-only" htmlFor="pregunta">Tu pregunta</label>
          <input id="pregunta" className="field" style={{ minHeight: 48 }} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: ¿cómo va Andina?" autoComplete="off" />
          <button className="btn btn-primary" type="submit" disabled={busy || !q.trim()}>Enviar</button>
        </form>
      </div>
    </div>
  );
}
