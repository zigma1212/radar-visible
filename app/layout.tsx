import type { Metadata, Viewport } from "next";
import { Fraunces, Figtree } from "next/font/google";
import "./globals.css";
import { NavTop, NavBottom } from "@/components/nav";
import { Logo } from "@/components/ui";
import Link from "next/link";

const display = Fraunces({ variable: "--f-display", subsets: ["latin"], display: "swap" });
const body = Figtree({ variable: "--f-body", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Radar · Interés compuesto a la vista",
  description: "Haz visible el valor acumulado en cada cuenta antes de su renovación. Demo con datos simulados.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#2b1a66" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${display.variable} ${body.variable}`}>
      <body>
        <a href="#main" className="skip">Saltar al contenido</a>
        <header className="topbar on-dark">
          <div className="wrap">
            <Link href="/" className="brand" aria-label="Radar · Interés compuesto a la vista, inicio">
              <span className="brand-mark"><Logo /></span>
              <span>Radar<span className="brand-sub"> · Interés compuesto a la vista</span></span>
            </Link>
            <NavTop />
            <span className="sim-badge" title="Todo lo que ves es información inventada para la demo">Datos simulados</span>
          </div>
        </header>
        <main id="main" className="wrap">{children}</main>
        <NavBottom />
      </body>
    </html>
  );
}
