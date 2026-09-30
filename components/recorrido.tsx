"use client";
import { useEffect, useState } from "react";

/** Barra de avance fina y navegación por teclado (j/k o flechas abajo/arriba) entre secciones. */
export function Recorrido({ ids }: { ids: string[] }) {
  const [avance, setAvance] = useState(0);
  const [actual, setActual] = useState(0);

  useEffect(() => {
    const posicion = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setAvance(max > 0 ? Math.min(1, window.scrollY / max) : 0);
      const linea = window.innerHeight * 0.4;
      let idx = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= linea) idx = i;
      });
      setActual(idx);
    };
    const ir = (delta: number) => {
      const el = document.getElementById(ids[Math.min(ids.length - 1, Math.max(0, actualRef.i + delta))]);
      const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el?.scrollIntoView({ behavior: quieto ? "auto" : "smooth", block: "start" });
    };
    const actualRef = { i: 0 };
    const sync = () => {
      posicion();
      const linea = window.innerHeight * 0.4;
      let idx = 0;
      ids.forEach((id, i) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= linea) idx = i;
      });
      actualRef.i = idx;
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (e.key === "j" || e.key === "ArrowDown") { e.preventDefault(); sync(); ir(1); }
      else if (e.key === "k" || e.key === "ArrowUp") { e.preventDefault(); sync(); ir(-1); }
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("keydown", tecla);
    return () => {
      window.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      window.removeEventListener("keydown", tecla);
    };
  }, [ids]);

  return (
    <>
      <div className="recorrido-barra" role="progressbar" aria-label="Avance del diagnóstico" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(avance * 100)}>
        <span style={{ transform: `scaleX(${avance})` }} />
      </div>
      <p className="recorrido-pos tnum" aria-hidden="true">{actual + 1} / {ids.length} <span>j / k</span></p>
    </>
  );
}
