// Genera los datos simulados del radar en data/mock/*.json.
// Determinista (PRNG con semilla fija) y relativo a DEMO_TODAY (por defecto 2026-10-05).
// Uso: npm run seed   (equivale a: npx tsx scripts/seed.ts)
// Todos los nombres de personas y empresas son INVENTADOS.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { hoy as hoyFn, lecturaSimulada, sumarDias } from "../lib/fecha";
import { zonaDeMes, mesPrograma } from "../lib/motor/zona";
import type {
  Aprobacion, BrandManager, Cuenta, Deal, Factura, Fuente, Plan, Publicacion, Reunion,
} from "../lib/tipos";

const HOY = hoyFn();

// PRNG mulberry32 con semilla fija
let estado = 20261005;
function rnd(): number {
  estado |= 0; estado = (estado + 0x6d2b79f5) | 0;
  let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const entre = (a: number, b: number) => a + rnd() * (b - a);
const entero = (a: number, b: number) => Math.floor(entre(a, b + 1));
const elegir = <T,>(xs: T[]): T => xs[Math.floor(rnd() * xs.length)];

const FEE: Record<Plan, number> = { Esencial: 3_500_000, Pro: 6_000_000, Corporativo: 12_000_000 };
const PACTADOS: Record<Plan, number> = { Esencial: 4, Pro: 8, Corporativo: 12 };
const BASE_IMP: Record<Plan, number> = { Esencial: 500, Pro: 800, Corporativo: 1200 };

const brand_managers: BrandManager[] = [
  { id: "bm1", nombre: "Valentina Correa", email: "valentina.correa@ejemplo.co", capacidad_max: 6 },
  { id: "bm2", nombre: "Julián Botero", email: "julian.botero@ejemplo.co", capacidad_max: 8 },
  { id: "bm3", nombre: "Mariana Uribe", email: "mariana.uribe@ejemplo.co", capacidad_max: 7 },
  { id: "bm4", nombre: "Tomás Escallón", email: "tomas.escallon@ejemplo.co", capacidad_max: 8 },
];

interface Def {
  id: string; cliente: string; cargo: string; empresa: string; sector: string; plan: Plan; bm: string;
  inicioDias: number; // días desde fecha_inicio hasta hoy
  esperada: "onboarding" | "parte plana" | "tracción";
  pactados?: number;
  aprob?: number; pend?: number; posts30?: number; reu?: number;
  frases?: string[]; venc?: number; renov?: number; sinMagnettu?: boolean;
}

const DEFS: Def[] = [
  // ---- BM1 Valentina (sobrecargada: 8 cuentas, capacidad 6; incluye las 3 rojas) ----
  // Historia 1: no aprueba hace 13 días, sin reunión en 37 días, factura vencida 18 días
  { id: "c01", cliente: "Rodrigo Palacios Zuluaga", cargo: "Gerente General", empresa: "Andina Seguros", sector: "Seguros", plan: "Pro", bm: "bm1", inicioDias: 75, esperada: "parte plana", aprob: 13, pend: 4, posts30: 5, reu: 37, venc: 18, renov: 92 },
  // Historia 2: reunión reciente con frases de duda; renovación en 38 días
  { id: "c02", cliente: "Marcela Echeverri Duque", cargo: "CEO", empresa: "Logística Ríoseco", sector: "Logística", plan: "Corporativo", bm: "bm1", inicioDias: 105, esperada: "parte plana", aprob: 4, pend: 1, posts30: 11, reu: 6, frases: ["no veo resultados", "estoy pensando en pausar"], renov: 38 },
  // Historia 3: renovación en 20 días y cadencia al 45 % (5 de 11)
  { id: "c03", cliente: "Ignacio Lozano Barrera", cargo: "Fundador y CEO", empresa: "Agroexport Cumbres", sector: "Agroindustria", plan: "Corporativo", bm: "bm1", inicioDias: 110, esperada: "parte plana", pactados: 11, aprob: 6, pend: 2, posts30: 5, reu: 17, renov: 20 },
  // Ámbar: dos señales en atención (aprobación lenta y 3 posts pendientes)
  { id: "c04", cliente: "Paola Sandoval Ibáñez", cargo: "Directora Comercial", empresa: "Textiles Marabú", sector: "Textil y moda", plan: "Esencial", bm: "bm1", inicioDias: 108, esperada: "parte plana", aprob: 9, pend: 3, reu: 14 },
  { id: "c05", cliente: "Camilo Hidalgo Mora", cargo: "CEO", empresa: "Fintec Aurora", sector: "Fintech", plan: "Corporativo", bm: "bm1", inicioDias: 420, esperada: "tracción" },
  { id: "c06", cliente: "Natalia Bermúdez Cano", cargo: "CTO", empresa: "Software Quilla", sector: "Software", plan: "Pro", bm: "bm1", inicioDias: 280, esperada: "tracción" },
  { id: "c07", cliente: "Esteban Rivas Pardo", cargo: "Socio Director", empresa: "Consultores Mirador", sector: "Consultoría", plan: "Pro", bm: "bm1", inicioDias: 48, esperada: "parte plana", aprob: 3, pend: 1 },
  { id: "c08", cliente: "Lucía Fernanda Montoya", cargo: "Gerente General", empresa: "Energía Solaris Andes", sector: "Energía", plan: "Esencial", bm: "bm1", inicioDias: 230, esperada: "tracción" },
  // ---- BM2 Julián (6 cuentas) ----
  // Ámbar: factura vencida 8 días + cadencia al 62 %
  { id: "c09", cliente: "Álvaro Cifuentes Rojas", cargo: "Presidente", empresa: "Hoteles Costa Serena", sector: "Hotelería", plan: "Pro", bm: "bm2", inicioDias: 215, esperada: "tracción", venc: 8, posts30: 5 },
  // Ámbar: un solo riesgo (sin reunión hace 40 días) estando en tracción
  { id: "c10", cliente: "Sofía Arbeláez Gil", cargo: "Directora General", empresa: "Laboratorios Nevada", sector: "Salud", plan: "Corporativo", bm: "bm2", inicioDias: 290, esperada: "tracción", reu: 40 },
  { id: "c11", cliente: "Felipe Ordóñez Pinto", cargo: "CEO", empresa: "Constructora Altamira", sector: "Construcción", plan: "Pro", bm: "bm2", inicioDias: 95, esperada: "parte plana" },
  // Verde con una factura vencida 5 días -> recordatorio amable de pago
  { id: "c12", cliente: "Adriana Salcedo Vega", cargo: "Rectora", empresa: "Educa Horizonte", sector: "Educación", plan: "Esencial", bm: "bm2", inicioDias: 250, esperada: "tracción", venc: 5 },
  { id: "c13", cliente: "Martín Cardona Osorio", cargo: "Gerente General", empresa: "Bodegas del Valle Sur", sector: "Vinos y licores", plan: "Pro", bm: "bm2", inicioDias: 340, esperada: "tracción" },
  { id: "c14", cliente: "Juliana Rincón Barón", cargo: "CEO", empresa: "Movilidad Cóndor", sector: "Movilidad", plan: "Corporativo", bm: "bm2", inicioDias: 130, esperada: "parte plana" },
  // ---- BM3 Mariana (6 cuentas) ----
  // Ámbar: renovación en 30 días + una frase de duda ("presupuesto") -> llamada de Pedro
  { id: "c15", cliente: "Héctor Gaviria Londoño", cargo: "Gerente General", empresa: "Alimentos La Ceiba", sector: "Alimentos", plan: "Pro", bm: "bm3", inicioDias: 245, esperada: "tracción", reu: 12, frases: ["el presupuesto está apretado este trimestre"], renov: 30 },
  // SIN LECTURA: cuenta nueva, Magnettü todavía no tiene datos
  { id: "c16", cliente: "Carolina Zapata Lemus", cargo: "Directora Ejecutiva", empresa: "Salud Integral Pacífico", sector: "Salud", plan: "Pro", bm: "bm3", inicioDias: 14, esperada: "onboarding", reu: 7, sinMagnettu: true },
  { id: "c17", cliente: "Ricardo Naranjo Salazar", cargo: "Fundador", empresa: "Ingeniería Trópico", sector: "Ingeniería", plan: "Pro", bm: "bm3", inicioDias: 152, esperada: "parte plana" },
  { id: "c18", cliente: "Valeria Duarte Pineda", cargo: "Gerente Comercial", empresa: "Inmobiliaria Pinar Alto", sector: "Inmobiliario", plan: "Esencial", bm: "bm3", inicioDias: 310, esperada: "tracción" },
  { id: "c19", cliente: "Gustavo Peñaranda Ruiz", cargo: "CEO", empresa: "Escudo Andino Ciberseguridad", sector: "Ciberseguridad", plan: "Corporativo", bm: "bm3", inicioDias: 200, esperada: "tracción" },
  { id: "c20", cliente: "Ana María Tovar Cruz", cargo: "Gerente General", empresa: "Ecoempaques Sinú", sector: "Empaques", plan: "Pro", bm: "bm3", inicioDias: 380, esperada: "tracción" },
  // ---- BM4 Tomás (4 cuentas, holgura) ----
  { id: "c21", cliente: "Nicolás Ferrer Sierra", cargo: "Gerente", empresa: "Cooperativa Aguaclara", sector: "Cooperativas", plan: "Esencial", bm: "bm4", inicioDias: 50, esperada: "parte plana" },
  { id: "c22", cliente: "Isabela Cortés Mena", cargo: "Socia Fundadora", empresa: "Logos Legal Partners", sector: "Servicios legales", plan: "Pro", bm: "bm4", inicioDias: 100, esperada: "parte plana" },
  { id: "c23", cliente: "Andrés Roldán Nieto", cargo: "CEO", empresa: "Turismo Montaña Viva", sector: "Turismo", plan: "Corporativo", bm: "bm4", inicioDias: 265, esperada: "tracción" },
  { id: "c24", cliente: "Mónica Aristizábal Vélez", cargo: "Directora Científica", empresa: "Biotech Semilla", sector: "Biotecnología", plan: "Esencial", bm: "bm4", inicioDias: 28, esperada: "onboarding", posts30: 4 },
];

const TITULOS = [
  "Lo que aprendí de mi peor semestre", "Por qué contratamos despacio", "Tres decisiones que cambiaron la operación",
  "Una conversación difícil con el equipo", "Lo que nadie cuenta de crecer rápido", "Mi regla para las reuniones de lunes",
  "Un error caro que hoy agradezco", "Cómo elegimos a nuestros primeros clientes", "La pregunta que hago en cada entrevista",
  "Qué haría distinto si empezara hoy", "El día que casi cerramos", "Lo que le digo a quien quiere emprender",
];
const RESUMENES = [
  "Repaso de resultados del mes y ajuste del calendario de contenido.",
  "Revisión de los últimos posts y definición de temas para el próximo mes.",
  "Sesión de estrategia: tono de voz y próximos hitos del programa.",
];
const FRASES_OK = [
  "me gustó el enfoque de la semana pasada", "sigamos con el mismo ritmo", "mi equipo comercial lo comentó",
  "quiero contar la historia de la fundación", "me escribieron dos personas por el post", "vamos bien",
];

const cuentas: Cuenta[] = [];
const aprobaciones: Aprobacion[] = [];
const reuniones: Reunion[] = [];
const publicaciones: Publicacion[] = [];
const facturas: Factura[] = [];
const deals: Deal[] = [];

for (const d of DEFS) {
  const inicio = sumarDias(HOY, -d.inicioDias);
  const mes = mesPrograma(inicio, HOY);
  if (zonaDeMes(mes) !== d.esperada) throw new Error(`Zona inesperada para ${d.id}: mes ${mes}`);
  const pactados = d.pactados ?? PACTADOS[d.plan];
  cuentas.push({
    id: d.id, cliente: d.cliente, cargo: d.cargo, empresa: d.empresa, sector: d.sector, plan: d.plan,
    fee_mensual_cop: FEE[d.plan], fecha_inicio: inicio, brand_manager_id: d.bm, posts_pactados_mes: pactados,
  });

  // --- Notion: aprobaciones ---
  const aprobDias = d.aprob ?? entero(1, 4);
  const pend = d.pend ?? entero(0, 1);
  let n = 0;
  for (let k = 0; k < 6; k++) {
    const aprobado = sumarDias(HOY, -(aprobDias + 7 * k + (k ? entero(0, 2) : 0)));
    if (aprobado < inicio) break;
    aprobaciones.push({
      cuenta_id: d.id, post_id: `p-${d.id}-${++n}`, titulo: elegir(TITULOS),
      enviado_a_cliente: sumarDias(aprobado, -entero(1, 3)), aprobado_en: aprobado, estado: "aprobado",
    });
  }
  for (let k = 0; k < pend; k++) {
    const dias = Math.max(1, Math.min(entero(1, 10), aprobDias));
    aprobaciones.push({
      cuenta_id: d.id, post_id: `p-${d.id}-${++n}`, titulo: elegir(TITULOS),
      enviado_a_cliente: sumarDias(HOY, -dias), aprobado_en: null, estado: "pendiente",
    });
  }
  if (!aprobaciones.some((a) => a.cuenta_id === d.id)) {
    aprobaciones.push({ cuenta_id: d.id, post_id: `p-${d.id}-1`, titulo: elegir(TITULOS), enviado_a_cliente: sumarDias(HOY, -2), aprobado_en: null, estado: "pendiente" });
  }

  // --- Circleback: reuniones ---
  const reuDias = d.reu ?? entero(5, 16);
  const tipos = ["Seguimiento mensual", "Revisión de contenido", "Sesión de estrategia"];
  for (let k = 0; k < 3; k++) {
    const fecha = sumarDias(HOY, -(reuDias + k * entero(27, 33)));
    if (fecha < inicio) break;
    const ultima = k === 0;
    const frases = ultima && d.frases ? d.frases : [elegir(FRASES_OK), elegir(FRASES_OK)].filter((f, i, a) => a.indexOf(f) === i);
    reuniones.push({
      cuenta_id: d.id, fecha, tipo: tipos[k % 3],
      resumen: ultima && d.frases ? "El cliente expresó dudas sobre el retorno del programa y su continuidad." : elegir(RESUMENES),
      frases_clave: frases,
    });
  }
  if (!reuniones.some((r) => r.cuenta_id === d.id)) {
    reuniones.push({ cuenta_id: d.id, fecha: inicio, tipo: "Kickoff", resumen: "Arranque del programa.", frases_clave: [elegir(FRASES_OK)] });
  }

  // --- Magnettü: publicaciones (últimos ~120 días, coherentes con la curva) ---
  if (!d.sinMagnettu) {
    const posts30 = d.posts30 ?? Math.max(1, Math.round(pactados * entre(0.92, 1.06)));
    const dias: number[] = [];
    for (let i = 0; i < posts30; i++) dias.push(Math.min(29, Math.floor(((i + 0.5) * 30) / posts30 + entre(-1, 1))));
    for (let ventana = 1; ventana < 4; ventana++) {
      const c = Math.max(1, Math.round(pactados * entre(0.85, 1.04)));
      for (let i = 0; i < c; i++) dias.push(Math.min(30 * (ventana + 1) - 1, 30 * ventana + Math.floor(((i + 0.5) * 30) / c)));
    }
    for (const dd of dias.map((x) => Math.max(0, x))) {
      const fecha = sumarDias(HOY, -dd);
      if (fecha < inicio) continue;
      const t = Math.min(13, (d.inicioDias - dd) / 30.44);
      const curva = t <= 5 ? 1 + 0.12 * t : 1.6 * Math.exp(0.28 * Math.min(t - 5, 6));
      const imp = Math.round(BASE_IMP[d.plan] * curva * entre(0.78, 1.25));
      const pct = Math.min(0.55, Math.max(0.03, 0.05 + 0.065 * t + entre(-0.03, 0.03)));
      publicaciones.push({
        cuenta_id: d.id, fecha, impresiones: imp, pct_fuera_de_red: Math.round(pct * 1000) / 1000,
        reacciones: Math.round(imp * entre(0.02, 0.04)), comentarios: Math.round(imp * entre(0.002, 0.006)),
        guardados: Math.round(imp * entre(0.003, 0.009)), nuevos_seguidores: Math.round(imp * 0.005 * (1 + pct) * entre(0.6, 1.4)),
        conversaciones_iniciadas: Math.max(0, Math.round(0.3 + 0.75 * t + entre(0, 1.6))),
      });
    }
  }

  // --- Siigo: facturas mensuales ---
  const venc = d.venc ?? 0;
  const base0 = venc > 0 ? sumarDias(HOY, -venc) : sumarDias(HOY, 12);
  for (let k = 0; k < 4; k++) {
    const vence = sumarDias(base0, -30 * k);
    const emitida = sumarDias(vence, -15);
    if (emitida < inicio && k > 0) break;
    facturas.push({
      cuenta_id: d.id, numero: `FV-${d.id.toUpperCase()}-${String(4 - k).padStart(3, "0")}`, emitida, vence,
      valor_cop: FEE[d.plan], estado: k === 0 ? (venc > 0 ? "vencida" : "pendiente") : "pagada",
    });
  }

  // --- Pipedrive: deal de renovación ---
  const renov = d.renov ?? entero(70, 300);
  deals.push({
    cuenta_id: d.id, etapa: renov < 45 ? "Renovación en conversación" : "Cliente activo",
    fecha_renovacion: sumarDias(HOY, renov), valor_cop: FEE[d.plan] * 12,
  });
}

const lectura = lecturaSimulada(HOY);
const fuentes: Fuente[] = [
  { id: "notion", nombre: "Notion (Clientes y Calendario)", modo: "simulado", ultima_lectura: lectura, notas: "Datos simulados. Real: consulta a las bases de datos Clientes y Calendario con la API de Notion.", disponibilidad: "a_confirmar", pregunta_validacion: "¿Los clientes aprueban en Notion o por WhatsApp?" },
  { id: "circleback", nombre: "Circleback (reuniones)", modo: "simulado", ultima_lectura: lectura, notas: "Datos simulados. Real: exportación o webhook de resúmenes de reunión de Circleback.", disponibilidad: "a_confirmar", pregunta_validacion: "¿Se graban reuniones con clientes?" },
  { id: "magnettu", nombre: "Magnettü (métricas de LinkedIn)", modo: "simulado", ultima_lectura: lectura, notas: "Datos simulados. Real: exportación de métricas por publicación desde Magnettü. Una cuenta nueva no tiene datos todavía.", disponibilidad: "a_confirmar", pregunta_validacion: "¿Qué métricas exporta por cliente?" },
  { id: "siigo", nombre: "Siigo (facturación)", modo: "simulado", ultima_lectura: lectura, notas: "Datos simulados. Real: API de Siigo, endpoint de facturas de venta.", disponibilidad: "probable", pregunta_validacion: null },
  { id: "pipedrive", nombre: "Pipedrive (renovaciones)", modo: "simulado", ultima_lectura: lectura, notas: "Datos simulados. Real: API de deals de Pipedrive.", disponibilidad: "probable", pregunta_validacion: null },
  { id: "slack", nombre: "Slack (entrega del brief)", modo: "simulado", ultima_lectura: lectura, notas: "Simulado: el brief se muestra como vista previa. Real: SLACK_WEBHOOK_URL.", disponibilidad: "probable", pregunta_validacion: null },
];

const salida = join(__dirname, "..", "data", "mock");
mkdirSync(salida, { recursive: true });
const escribir = (nombre: string, datos: unknown) => writeFileSync(join(salida, `${nombre}.json`), JSON.stringify(datos, null, 2) + "\n");
escribir("brand_managers", brand_managers);
escribir("cuentas", cuentas);
escribir("aprobaciones", aprobaciones);
escribir("reuniones", reuniones);
escribir("publicaciones", publicaciones);
escribir("facturas", facturas);
escribir("deals", deals);
escribir("fuentes", fuentes);
console.log(`Seed OK (hoy=${HOY}): ${cuentas.length} cuentas, ${aprobaciones.length} aprobaciones, ${reuniones.length} reuniones, ${publicaciones.length} publicaciones, ${facturas.length} facturas, ${deals.length} deals.`);
