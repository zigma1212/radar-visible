"use client";
import Link from "next/link";
import { useState } from "react";
import { llamar } from "./api";
import { ErrorNote, ModoTag } from "./ui";

interface Accion { titulo: string; cuenta_id: string; empresa: string; dueno: string; dueno_nombre: string }
interface Brief { texto: string; acciones: Accion[]; modo: "ia" | "plantilla" }
interface Envio { enviado: boolean; destino: "slack" | "vista_previa"; vista_previa?: unknown }

const DUENO: Record<string, string> = { CEO: "Pedro", BM: "Brand manager", administracion: "Administración", operaciones: "Operaciones" };

export function BriefPanel({ fechaTexto }: { fechaTexto: string }) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [envio, setEnvio] = useState<Envio | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [errEnvio, setErrEnvio] = useState<string | null>(null);

  async function preparar() {
    setCargando(true); setError(null); setEnvio(null); setErrEnvio(null);
    const r = await llamar<Brief>("/api/brief", { method: "POST", json: {} });
    if (r.ok) setBrief(r.data); else setError(r.error);
    setCargando(false);
  }

  async function enviar() {
    setEnviando(true); setErrEnvio(null);
    const r = await llamar<Envio>("/api/brief/enviar", { method: "POST", json: brief ? { texto: brief.texto, acciones: brief.acciones } : {} });
    if (r.ok) setEnvio(r.data); else setErrEnvio(r.error);
    setEnviando(false);
  }

  return (
    <section className="grid gap-4" aria-labelledby="brief-h">
      <div className="card grid gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="eyebrow">Brief del lunes</p>
            <h2 id="brief-h" className="h2">Lo que tienes que saber esta semana</h2>
          </div>
          {brief ? <ModoTag modo={brief.modo} /> : null}
        </div>
        {!brief ? (
          <p className="muted">Un párrafo corto y tres acciones con dueño, armados solo con los datos de arriba. Sin adornos.</p>
        ) : (
          <>
            <p style={{ whiteSpace: "pre-line", fontSize: 17, lineHeight: 1.55 }}>{brief.texto}</p>
            <div>
              <p className="eyebrow" style={{ marginBottom: 8 }}>Tres acciones de la semana</p>
              <ol className="grid gap-2" style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {brief.acciones.map((a, i) => (
                  <li key={i} className="card-flat flex gap-3" style={{ padding: 12 }}>
                    <span className="display" style={{ fontSize: 26, lineHeight: 1, color: "var(--purple-2)" }} aria-hidden="true">{i + 1}</span>
                    <div className="grid gap-2">
                      <strong style={{ lineHeight: 1.3 }}>{a.titulo}</strong>
                      <div className="flex flex-wrap gap-2">
                        <Link className="chip" href={`/cuentas/${a.cuenta_id}`}>{a.empresa} →</Link>
                        <span className="chip chip-lime">Dueño: {a.dueno_nombre || DUENO[a.dueno] || a.dueno}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
        {error ? <ErrorNote>{error}</ErrorNote> : null}
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={preparar} disabled={cargando}>
            {cargando ? <><span className="spinner" aria-hidden="true" /> Preparando…</> : brief ? "Preparar de nuevo" : "Preparar brief"}
          </button>
        </div>
      </div>

      {brief ? (
        <div className="grid gap-3 rise">
          <div>
            <p className="eyebrow">Esto podría llegarte cada lunes</p>
            <h2 className="h2">Vista previa en Slack</h2>
          </div>
          <SlackPreview brief={brief} fechaTexto={fechaTexto} />
          <div className="grid gap-2" style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
            <button className="btn btn-primary" onClick={enviar} disabled={enviando}>
              {enviando ? <><span className="spinner" aria-hidden="true" /> Enviando…</> : "Enviar a Slack"}
            </button>
            {errEnvio ? <ErrorNote>{errEnvio}</ErrorNote> : null}
            {envio ? (
              <div className={`note ${envio.destino === "slack" ? "note-ok" : "note-info"}`} role="status">
                {envio.destino === "slack"
                  ? "Enviado al canal de Slack."
                  : "Slack todavía no está conectado, así que esto es una vista previa: nada salió de la app. Al conectar el webhook, este mismo botón lo envía de verdad."}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function SlackPreview({ brief, fechaTexto }: { brief: Brief; fechaTexto: string }) {
  return (
    <div className="phone" aria-label="Vista previa del mensaje en Slack">
      <div className="phone-in">
        <div className="phone-bar"><span># brief-del-lunes</span><span aria-hidden="true">⌄</span></div>
        <div className="slack-msg">
          <div className="slack-av" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M2 19c6 0 8-1.5 10.5-5.5S17 5 22 4" stroke="#d8f24a" strokeWidth="2.6" strokeLinecap="round" /><circle cx="12.5" cy="13.5" r="2.4" fill="#d8f24a" /></svg>
          </div>
          <div className="grid gap-2" style={{ minWidth: 0 }}>
            <div><strong>Radar</strong><span className="slack-app">APP</span><span style={{ color: "#616061", fontSize: 12 }}>7:00 a. m.</span></div>
            <div style={{ fontWeight: 800 }}>Brief del lunes · {fechaTexto}</div>
            <div style={{ whiteSpace: "pre-line" }}>{brief.texto}</div>
            <div style={{ borderLeft: "4px solid #d8f24a", paddingLeft: 10 }} className="grid gap-1">
              {brief.acciones.map((a, i) => (
                <div key={i}><strong>{i + 1}.</strong> {a.titulo} <span style={{ color: "#1264a3" }}>@{a.dueno_nombre}</span></div>
              ))}
            </div>
            <div style={{ color: "#616061", fontSize: 12 }}>Datos simulados · {brief.modo === "ia" ? "redactado con IA" : "plantilla"}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
