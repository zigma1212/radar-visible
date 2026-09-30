import Link from "next/link";

const ITEMS = [
  { href: "/diagnostico", t: "Diagnóstico", d: "El interés compuesto que nadie ve a tiempo: por qué este radar" },
  { href: "/equipo", t: "Equipo", d: "Cuentas y riesgos por brand manager" },
  { href: "/fuentes", t: "Fuentes", d: "De dónde sale cada dato y cómo conectarlo" },
  { href: "/importar", t: "Importar facturas", d: "Sube un CSV de facturas: la primera fuente real" },
  { href: "/ayuda", t: "Ayuda", d: "Cómo leer el semáforo y qué hacer cada lunes" },
];

export default function Mas() {
  return (
    <div className="page">
      <header><p className="eyebrow">Más</p><h1 className="h1">Más secciones</h1></header>
      <ul className="grid gap-3" style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {ITEMS.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="card flex items-center justify-between gap-3" style={{ textDecoration: "none" }}>
              <span><strong className="display" style={{ fontSize: 20 }}>{i.t}</strong><br /><span className="muted small">{i.d}</span></span>
              <span aria-hidden="true" style={{ fontSize: 22, color: "var(--purple-2)" }}>→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
