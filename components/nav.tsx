"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TOP = [
  { href: "/diagnostico", label: "Diagnóstico" },
  { href: "/", label: "Brief" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/bandeja", label: "Bandeja" },
  { href: "/equipo", label: "Equipo" },
  { href: "/preguntar", label: "Preguntar" },
  { href: "/fuentes", label: "Fuentes" },
  { href: "/importar", label: "Importar" },
  { href: "/ayuda", label: "Ayuda" },
];

const activo = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

export function NavTop() {
  const path = usePathname();
  return (
    <nav className="nav-top" aria-label="Principal">
      {TOP.map((i) => (
        <Link key={i.href} href={i.href} aria-current={activo(path, i.href) ? "page" : undefined}>
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

const Ico = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);

const TABS = [
  { href: "/", label: "Brief", icon: <Ico><path d="M3 18c5 0 7-1 9-4.5S16 6 21 5" /><circle cx="12" cy="13.5" r="1.5" /></Ico> },
  { href: "/cuentas", label: "Cuentas", icon: <Ico><path d="M4 6h16M4 12h16M4 18h10" /></Ico> },
  { href: "/bandeja", label: "Bandeja", icon: <Ico><path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5" /></Ico> },
  { href: "/preguntar", label: "Preguntar", icon: <Ico><path d="M4 5h16v11H9l-5 4z" /></Ico> },
  { href: "/mas", label: "Más", icon: <Ico><circle cx="5" cy="12" r="1.2" /><circle cx="12" cy="12" r="1.2" /><circle cx="19" cy="12" r="1.2" /></Ico> },
];
const MAS = ["/mas", "/diagnostico", "/equipo", "/fuentes", "/importar", "/ayuda"];

export function NavBottom() {
  const path = usePathname();
  return (
    <nav className="tabbar" aria-label="Principal (celular)">
      {TABS.map((t) => {
        const on = t.href === "/mas" ? MAS.some((m) => activo(path, m)) : activo(path, t.href);
        return (
          <Link key={t.href} href={t.href} aria-current={on ? "page" : undefined}>
            {t.icon}
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
