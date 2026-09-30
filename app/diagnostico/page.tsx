import type { Metadata } from "next";
import Link from "next/link";
import { Curva } from "@/components/curva";
import { Calculadora } from "@/components/calculadora";
import { FuenteIcon } from "@/components/ui";
import { Recorrido } from "@/components/recorrido";

export const metadata: Metadata = {
  title: "Diagnóstico · Radar",
  description: "El interés compuesto que nadie ve a tiempo: el diagnóstico detrás del Radar.",
};

const IDS = ["cita", "patron", "curva", "pistas", "porque", "valor", "distinto", "supuestos"];

const PATRON = [
  { f: "Pedro, Latam Fintech Market (sept.)", q: "Nadie se posiciona en el octavo post. Pero ahí es donde casi todos abandonan." },
  { f: "Visible, reel del interés compuesto", q: "Los primeros posts no se sienten como avance, y por eso la mayoría abandona justo ahí." },
  { f: "Visible, “LinkedIn funciona como el gimnasio”", q: "Nadie se pone fuerte entrenando un día y desapareciendo dos semanas." },
  { f: "Pedro, sobre quien concluye que LinkedIn no sirve", q: "Publica durante dos semanas, no logra nada y concluye que LinkedIn no sirve." },
  { f: "Pedro, “a mí también me va como los perros en misa”", q: "Las métricas son vanidad, pero también son información." },
  { f: "Pedro, sobre los 11 toques", q: "La constancia no es una virtud: es el requisito mínimo." },
];

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

const N = ({ i }: { i: number }) => <p className="dx-n tnum">{i} de {IDS.length}</p>;

export default function Diagnostico() {
  return (
    <>
      <Recorrido ids={IDS} />
      <div className="dx">
        <section id="cita" className="dx-sec" aria-labelledby="h-cita">
          <N i={1} />
          <h1 id="h-cita" className="dx-quote">“Cada publicación deja un rastro de confianza que ninguna métrica registra.”</h1>
          <p className="dx-quote-src">Pedro Mejía, LinkedIn, sept. 2026</p>
          <p className="dx-ask">¿Dónde queda ese rastro dentro de Visible?</p>
        </section>

        <section id="patron" className="dx-sec" aria-labelledby="h-patron">
          <N i={2} />
          <h2 id="h-patron" className="dx-h">El patrón que Visible repite en público</h2>
          <p className="dx-lead">En tres meses, Pedro y la página de Visible vuelven a la misma idea: el avance existe, pero no se ve, y ahí la gente abandona.</p>
          <div className="dx-cards">
            {PATRON.map((x) => (
              <figure key={x.q} className="dx-card">
                <blockquote>“{x.q}”</blockquote>
                <figcaption className="src">{x.f}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section id="curva" className="dx-sec" aria-labelledby="h-curva">
          <N i={3} />
          <h2 id="h-curva" className="dx-h">Lo que Visible vende se acumula lento y en silencio.</h2>
          <div className="dx-curva">
            <Curva puntos={[]} />
          </div>
          <p className="dx-lead" style={{ maxWidth: "60ch" }}>
            En la parte plana antes de la renovación, el avance existe pero no se siente. El riesgo no es el trabajo: es que nadie lo vea a tiempo.
          </p>
        </section>

        <section id="pistas" className="dx-sec" aria-labelledby="h-pistas">
          <N i={4} />
          <h2 id="h-pistas" className="dx-h">Las pistas existen, pero viven separadas</h2>
          <div className="dx-rows">
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
          </div>
          <p className="dx-lead">Cada brand manager ve su pedazo. El CEO ve el total solo cuando pregunta.</p>
        </section>

        <section id="porque" className="dx-sec" aria-labelledby="h-porque">
          <N i={5} />
          <h2 id="h-porque" className="dx-h">Por qué este problema y no otro</h2>
          <div className="dx-cmp">
            {CANDIDATOS.map((c) => (
              <div key={c.n} className="dx-opt"><strong>{c.n}</strong><span>{c.w}</span></div>
            ))}
            <div className="dx-opt elegido">
              <strong>Interés compuesto a la vista</strong>
              <span>Toca caja (renovación y expansión), usa datos que ya existen, y ordena a CEO, brand managers y administración alrededor de una pregunta.</span>
            </div>
          </div>
        </section>

        <section id="valor" className="dx-sec" aria-labelledby="h-valor">
          <N i={6} />
          <h2 id="h-valor" className="dx-h">Cuánto vale</h2>
          <p className="dx-lead" style={{ maxWidth: "60ch" }}>
            No tengo los números de Visible, así que no invento una cifra. La calculadora trae los campos vacíos: valor de la cuenta, meses que suele durar, costo de conseguir una nueva. Pedro pone sus números y ve cuánto vale anticipar una sola renovación.
          </p>
          <div style={{ maxWidth: 980 }}><Calculadora /></div>
          <Link href="/#calc-h" className="chip" style={{ justifySelf: "start" }}>Abrir la calculadora en el radar</Link>
        </section>

        <section id="distinto" className="dx-sec" aria-labelledby="h-distinto">
          <N i={7} />
          <h2 id="h-distinto" className="dx-h">Qué hace que no sea un tablero más</h2>
          <div className="dx-2col">
            <div>
              <ol className="dx-list dots" aria-label="Qué lo hace distinto">
                {DISTINTO.map((d) => <li key={d}>{d}</li>)}
              </ol>
            </div>
            <div>
              <h3 className="dx-sub">Principios de diseño</h3>
              <ol className="dx-list" aria-label="Principios de diseño">
                {PRINCIPIOS.map(([a, b]) => <li key={a}><span><b>{a}</b>{b}</span></li>)}
              </ol>
            </div>
          </div>
        </section>

        <section id="supuestos" className="dx-sec" aria-labelledby="h-supuestos">
          <N i={8} />
          <h2 id="h-supuestos" className="dx-h">Supuestos que validaría la primera semana</h2>
          <ul className="dx-list dots" aria-label="Supuestos">
            {SUPUESTOS.map((s) => <li key={s}>{s}</li>)}
          </ul>
          <Link href="/" className="btn btn-primary dx-cta">Ver el radar funcionando →</Link>
        </section>
      </div>
    </>
  );
}
