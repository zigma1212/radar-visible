import type { Metadata } from "next";
import Link from "next/link";
import { Calculadora } from "@/components/calculadora";
import { FuenteIcon } from "@/components/ui";
import { Recorrido } from "@/components/recorrido";
import Image from "next/image";
import { InView, Reveal } from "@/components/dx/in-view";
import { CurvaDx } from "@/components/dx/curva-dx";
import { cargarPanorama } from "@/lib/radar";
import { briefPlantilla, hechosDelBrief } from "@/lib/ia/brief";
import { fechaLarga } from "@/lib/ia/util";
import { Logo } from "@/components/ui";
import { serif, raleway } from "./fonts";

export const metadata: Metadata = {
  title: "Diagnóstico · Radar",
  description: "El interés compuesto que nadie ve a tiempo: el diagnóstico detrás del Radar.",
};

export const dynamic = "force-dynamic";

const IDS = ["cita", "patron", "curva", "pistas", "porque", "valor", "distinto", "supuestos"];

const PATRON: { f: string; q: string; k: string[] }[] = [
  { f: "Pedro, Latam Fintech Market (sept.)", q: "Nadie se posiciona en el octavo post. Pero ahí es donde casi todos abandonan.", k: ["octavo post", "abandonan"] },
  { f: "Visible, reel del interés compuesto", q: "Los primeros posts no se sienten como avance, y por eso la mayoría abandona justo ahí.", k: ["abandona"] },
  { f: "Visible, “LinkedIn funciona como el gimnasio”", q: "Nadie se pone fuerte entrenando un día y desapareciendo dos semanas.", k: ["desapareciendo"] },
  { f: "Pedro, sobre quien concluye que LinkedIn no sirve", q: "Publica durante dos semanas, no logra nada y concluye que LinkedIn no sirve.", k: ["no sirve"] },
  { f: "Pedro, “a mí también me va como los perros en misa”", q: "Las métricas son vanidad, pero también son información.", k: ["información"] },
  { f: "Pedro, sobre los 11 toques", q: "La constancia no es una virtud: es el requisito mínimo.", k: ["constancia"] },
];

function resaltar(q: string, k: string[]) {
  const re = new RegExp(`(${k.join("|")})`, "g");
  return q.split(re).map((t, i) => (k.includes(t) ? <mark key={i} className="dx-mk">{t}</mark> : t));
}

const PISTAS = [
  { p: "El cliente deja de aprobar contenido", d: "Notion o WhatsApp", c: "a", i: "notion" },
  { p: "La última conversación trajo un “no veo resultados”", d: "Notas de reunión (Circleback)", c: "a", i: "circleback" },
  { p: "Se publica menos de lo acordado; el alcance fuera de la red crece", d: "Métricas de LinkedIn (Magnettü o export)", c: "a", i: "magnettu" },
  { p: "La factura se venció", d: "Siigo", c: "p", i: "siigo" },
  { p: "La renovación se acerca", d: "Pipedrive", c: "p", i: "pipedrive" },
  { p: "Cuando alguien quiere saber cómo va un cliente", d: "Lo pregunta por WhatsApp", c: "h", i: "slack" },
];

const CANDIDATOS = [
  { n: "Tablero que una Notion, Pipedrive y Siigo", w: "Un tablero sin pregunta de negocio es un tablero más" },
  { n: "Bot que escriba contenido", w: "Choca con la tesis de Visible: “usar la tecnología sin entregarle el criterio”" },
  { n: "Flujo de lead a cliente", w: "Importante, pero Visible ya vende con la marca del fundador; cuidar lo que ya se ganó rinde más por peso invertido" },
  { n: "Operación de brand managers", w: "Queda incluida: el radar ordena su semana" },
];

const DISTINTO = [
  "No muestra datos: propone la acción de la semana con dueño.",
  "Prepara la nota de avance con los números de cada cliente; el brand manager solo edita y aprueba.",
  "Lo que no sabe lo dice (“sin lectura”), en lugar de pintarlo verde.",
  "Los umbrales son puntos de partida: se calibran con las cinco cuentas que el equipo mejor conoce.",
];

const PRINCIPIOS = [
  ["Lo desconocido nunca se pinta verde.", " Si una fuente no leyó, la cuenta dice “sin lectura”."],
  ["Funciona con lo mínimo y mejora con más.", " Con Siigo y Pipedrive ya sirve; cada fuente adicional suma precisión."],
  ["La IA hace el borrador, el humano pone el criterio.", " Nada llega al cliente sin aprobación."],
  ["Vive donde ya trabajan.", " Slack para el brief; lo demás, en la herramienta de siempre."],
  ["Sobrevive sin mí.", " Umbrales en un solo archivo, manual para no técnicos y una guía para conectar cada herramienta real."],
];

const SUPUESTOS = [
  "Dónde aprueban realmente los clientes: Notion o WhatsApp.",
  "Si Circleback graba reuniones con clientes.",
  "Qué exporta Magnettü por cliente.",
  "Cómo se estructura la renovación en cada tipo de cuenta: individual, programa corporativo, cohorte.",
];

const N = ({ i, foto }: { i: number; foto?: boolean }) => <p className={`dx-n tnum${foto ? " on-photo" : ""}`}>{i} de {IDS.length}</p>;

const CITA = "Cada publicación deja un rastro de confianza que ninguna métrica registra.".split(" ");

function Flechas() {
  return (
    <svg className="dx-arrows" viewBox="0 0 120 120" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <g key={i} transform={`translate(${i * -6} ${i * 38 - 4})`} opacity={1 - i * 0.28}>
          <path d="M40 76 L98 18" />
          <path d="M58 18 H98 V58" />
        </g>
      ))}
    </svg>
  );
}

export default async function Diagnostico() {
  const { panorama } = await cargarPanorama();
  const brief = briefPlantilla(hechosDelBrief(panorama))
    .replace(" Esta semana: ", "\nEsta semana:\n")
    .replace(/ (?=\d\. )/g, "\n");
  return (
    <>
      <noscript>
        <style>{".rv,.dx-w,.dx-fade{opacity:1!important;filter:none!important;transform:none!important}.dx-mk{background-size:100% 100%!important}.dx-line{stroke-dashoffset:0!important}"}</style>
      </noscript>
      <Recorrido ids={IDS} />
      <div className={`dx ${serif.variable} ${raleway.variable}`}>
        <section id="cita" className="dx-hero" aria-labelledby="h-cita">
          <div className="dx-hero-bg">
            <Image src="/fotos/hero.jpg" alt="Ejecutiva revisando documentos en su escritorio, en blanco y negro" fill priority sizes="100vw" />
          </div>
          <Flechas />
          <div style={{ display: "grid", gap: 18 }}>
            <N i={1} foto />
            <Reveal className="dx-top">
              <span>Propuesta independiente para</span>
              <Image className="logo" src="/marca/visible-logo-blanco.svg" alt="visible." width={105} height={22} />
              <span className="by">por Miguel Tusso</span>
            </Reveal>
          </div>
          <div className="dx-quote-wrap">
            <InView>
              <h1 id="h-cita" className="dx-quote">
                {CITA.map((w, i) => (
                  <span key={i}>
                    <span className="dx-w" style={{ "--i": i } as React.CSSProperties}>{w}</span>{" "}
                  </span>
                ))}
              </h1>
            </InView>
            <Reveal d={1100}><p className="dx-quote-src">Pedro Mejía · charla en Latam Fintech Market, sept. 2026</p></Reveal>
          </div>
          <div className="dx-hero-foot">
            <Reveal d={1500}>
              <p className="dx-ask">¿Dónde queda ese <mark className="dx-mk on-dark">rastro</mark> dentro de Visible?<span className="dx-cursor" aria-hidden="true">_</span></p>
            </Reveal>
            <p className="dx-credit">Foto: Vitaly Gariev · Unsplash</p>
          </div>
        </section>

        <section id="patron" className="dx-sec dx-alt" aria-labelledby="h-patron">
          <Reveal><N i={2} /></Reveal>
          <Reveal><h2 id="h-patron" className="dx-h">El patrón que Visible repite en público</h2></Reveal>
          <Reveal><p className="dx-lead">En tres meses, Pedro y la página de Visible vuelven a la misma idea: el avance existe, pero no se ve, y ahí la gente abandona.</p></Reveal>
          <div className="dx-cards">
            {PATRON.map((x, i) => (
              <Reveal as="figure" key={x.q} className="dx-card" d={(i % 3) * 110 + Math.floor(i / 3) * 80}>
                <span className="qm" aria-hidden="true">“</span>
                <blockquote>{resaltar(x.q, x.k)}</blockquote>
                <figcaption className="src">{x.f}</figcaption>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="curva" className="dx-sec" aria-labelledby="h-curva">
          <Reveal><N i={3} /></Reveal>
          <Reveal><h2 id="h-curva" className="dx-h">Lo que Visible vende se acumula lento y en silencio.</h2></Reveal>
          <div className="dx-curva"><CurvaDx /></div>
          <Reveal className="dx-conn" d={200}>
            <span className="dot" aria-hidden="true" />
            <p className="dx-lead">
              En la parte plana antes de la renovación, el avance existe pero no se siente. El riesgo no es el trabajo: es que nadie lo vea a tiempo.
            </p>
          </Reveal>
        </section>

        <figure className="dx-band">
          <Image src="/fotos/ciudad.jpg" alt="Bogotá al atardecer, con el cielo índigo y nubes naranjas" fill sizes="100vw" />
          <Reveal>
            <blockquote>La primera regla del interés compuesto es no interrumpirlo.</blockquote>
            <figcaption>Charlie Munger, citado por Pedro en su charla</figcaption>
          </Reveal>
        </figure>

        <section id="pistas" className="dx-sec" aria-labelledby="h-pistas">
          <Reveal><N i={4} /></Reveal>
          <Reveal><h2 id="h-pistas" className="dx-h">Las pistas existen, pero viven separadas</h2></Reveal>
          <Reveal className="dx-rows">
            {PISTAS.map((x) => (
              <div key={x.p} className="dx-row">
                <span className="sig-ico" style={{ width: 44, height: 44 }}><FuenteIcon fuente={x.i} size={22} /></span>
                <span className="t">{x.p}</span>
                <span className="w">{x.d}</span>
                <span className="chipcol">
                  {x.c === "p" ? <span className="pill p-verde"><i />Probable</span>
                    : x.c === "a" ? <span className="pill p-ambar"><i />A confirmar</span>
                    : <span className="chip chip-line">Hecho declarado en el brief</span>}
                </span>
              </div>
            ))}
          </Reveal>
          <Reveal><p className="dx-lead">Cada brand manager ve su pedazo. El CEO ve el total solo cuando pregunta.</p></Reveal>
        </section>

        <section id="porque" className="dx-sec dx-soft" aria-labelledby="h-porque">
          <Reveal><N i={5} /></Reveal>
          <Reveal><h2 id="h-porque" className="dx-h">Por qué este problema y no otro</h2></Reveal>
          <div className="dx-cmp">
            {CANDIDATOS.map((c, i) => (
              <Reveal key={c.n} className="dx-opt" d={i * 90}><strong>{c.n}</strong><span>{c.w}</span></Reveal>
            ))}
            <Reveal className="dx-opt elegido" d={480}>
              <div>
                <span className="dx-tag">ELEGIDO</span>
                <strong>Interés compuesto a la vista</strong>
              </div>
              <span>Toca caja (renovación y expansión), usa datos que ya existen, y ordena a CEO, brand managers y administración alrededor de una pregunta.</span>
            </Reveal>
          </div>
        </section>

        <section id="valor" className="dx-sec" aria-labelledby="h-valor">
          <Reveal><N i={6} /></Reveal>
          <Reveal><h2 id="h-valor" className="dx-h">Cuánto vale</h2></Reveal>
          <Reveal>
            <p className="dx-lead" style={{ maxWidth: "60ch" }}>
              No tengo los números de Visible, así que no invento una cifra. La calculadora trae los campos vacíos: valor de la cuenta, meses que suele durar, costo de conseguir una nueva. Pedro pone sus números y ve cuánto vale anticipar una sola renovación.
            </p>
          </Reveal>
          <Reveal><div style={{ maxWidth: 980 }}><Calculadora /></div></Reveal>
          <Link href="/#calc-h" className="dx-link">Abrir la calculadora en el radar ↗</Link>
        </section>

        <section id="distinto" className="dx-sec dx-soft" aria-labelledby="h-distinto">
          <Reveal><N i={7} /></Reveal>
          <Reveal><h2 id="h-distinto" className="dx-h">Qué hace que no sea un tablero más</h2></Reveal>
          <div className="dx-2col">
            <Reveal className="dx-photo">
              <Image src="/fotos/constancia.jpg" alt="Una mano escribiendo con lapicero en un cuaderno, en blanco y negro" fill sizes="(min-width: 1000px) 40vw, 100vw" />
            </Reveal>
            <div className="dx-stack">
              <Reveal>
                <ol className="dx-list dots" aria-label="Qué lo hace distinto">
                  {DISTINTO.map((d) => <li key={d}>{d}</li>)}
                </ol>
              </Reveal>
              <Reveal d={120}>
                <h3 className="dx-sub">Principios de diseño</h3>
                <ol className="dx-list" aria-label="Principios de diseño">
                  {PRINCIPIOS.map(([a, b]) => <li key={a}><span><b>{a}</b>{b}</span></li>)}
                </ol>
              </Reveal>
            </div>
          </div>
        </section>

        <section id="supuestos" className="dx-sec dx-alt" aria-labelledby="h-supuestos">
          <Reveal><N i={8} /></Reveal>
          <div className="dx-final">
            <div className="dx-final-txt">
              <Reveal><h2 id="h-supuestos" className="dx-h">Supuestos que validaría la primera semana</h2></Reveal>
              <Reveal d={100}>
                <ul className="dx-list dots" aria-label="Supuestos">
                  {SUPUESTOS.map((s) => <li key={s}>{s}</li>)}
                </ul>
              </Reveal>
              <Reveal d={200}><Link href="/" className="dx-cta-btn">Ver el radar funcionando ↗</Link></Reveal>
            </div>
            <Reveal d={150}>
              <div className="dx-iphone" role="img" aria-label="Celular mostrando el Brief del lunes llegando al canal #brief-lunes de Slack">
                <div className="dx-screen" aria-hidden="true">
                  <div className="dx-status"><span>9:41</span><i className="dx-island" /><span>5G ▮▮▮</span></div>
                  <div className="dx-slack-h">#brief-lunes<small>Demo · datos simulados</small></div>
                  <div className="dx-msg">
                    <span className="dx-av"><Logo size={20} /></span>
                    <div>
                      <span className="who">Radar Visible<span className="app">APP</span></span>
                      <h3>Brief del lunes · {fechaLarga(panorama.hoy)}</h3>
                      <p>{brief}</p>
                    </div>
                  </div>
                  <div className="dx-compose">Mensaje a #brief-lunes</div>
                  <div className="dx-home" />
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <footer className="dx-foot">
          <p>Fotos: Unsplash (Vitaly Gariev, Diego Céspedes Cabrera, Priscilla Du Preez). Logo de visible. usado solo para identificar a quién va dirigida esta propuesta.</p>
        </footer>
      </div>
    </>
  );
}
