// Tipos del Radar de la parte plana (spec §3 y §6).

export type FuenteId = "notion" | "circleback" | "magnettu" | "siigo" | "pipedrive" | "slack";
export type ModoFuente = "simulado" | "real" | "real_csv";
export type Disponibilidad = "probable" | "a_confirmar";
export type Plan = "Esencial" | "Pro" | "Corporativo";
export type Zona = "onboarding" | "parte plana" | "tracción";
export type Severidad = "ok" | "atencion" | "riesgo" | "sin_lectura";
export type Semaforo = "verde" | "ambar" | "rojo" | "sin_lectura";
export type Dueno = "CEO" | "BM" | "administracion" | "operaciones";

export interface BrandManager {
  id: string;
  nombre: string;
  email: string;
  capacidad_max: number;
}

export interface Cuenta {
  id: string;
  cliente: string;
  cargo: string;
  empresa: string;
  sector: string;
  plan: Plan;
  fee_mensual_cop: number;
  fecha_inicio: string;
  brand_manager_id: string;
  posts_pactados_mes: number;
}

export interface Aprobacion {
  cuenta_id: string;
  post_id: string;
  titulo: string;
  enviado_a_cliente: string;
  aprobado_en: string | null;
  estado: "pendiente" | "aprobado" | "rechazado";
}

export interface Reunion {
  cuenta_id: string;
  fecha: string;
  tipo: string;
  resumen: string;
  frases_clave: string[];
}

export interface Publicacion {
  cuenta_id: string;
  fecha: string;
  impresiones: number;
  pct_fuera_de_red: number; // 0..1
  reacciones: number;
  comentarios: number;
  guardados: number;
  nuevos_seguidores: number;
  conversaciones_iniciadas: number;
}

export interface Factura {
  cuenta_id: string;
  numero: string;
  emitida: string;
  vence: string;
  valor_cop: number;
  estado: "pagada" | "pendiente" | "vencida";
}

export interface Deal {
  cuenta_id: string;
  etapa: string;
  fecha_renovacion: string;
  valor_cop: number;
}

export interface Fuente {
  id: FuenteId;
  nombre: string;
  modo: ModoFuente;
  ultima_lectura: string;
  notas: string;
  /** Qué tan seguro es que la fuente exista tal como se modela (revisión adversarial 1). */
  disponibilidad: Disponibilidad;
  /** Pregunta a validar con Visible la primera semana; null si no aplica. */
  pregunta_validacion: string | null;
}

export interface Lectura<T> {
  datos: T;
  leido_en: string;
  modo: ModoFuente;
}

/** Datos que consume el motor. `null` = la fuente no se pudo leer (sin lectura). */
export interface DatosRadar {
  brand_managers: BrandManager[];
  cuentas: Cuenta[];
  aprobaciones: Aprobacion[] | null;
  reuniones: Reunion[] | null;
  publicaciones: Publicacion[] | null;
  facturas: Factura[] | null;
  deals: Deal[] | null;
  /** Momento de lectura por fuente; null si no se leyó. */
  leido_en: Partial<Record<FuenteId, string | null>>;
}

export interface Senal {
  id: string;
  nombre: string;
  fuente: FuenteId;
  valor: number | string | null;
  umbral: string;
  severidad: Severidad;
  leido_en: string | null;
  explicacion: string;
}

export interface AccionSugerida {
  titulo: string;
  dueno: Dueno;
  dueno_nombre: string;
  motivo: string;
}

export interface CuentaEvaluada {
  id: string;
  cliente: string;
  cargo: string;
  empresa: string;
  plan: Plan;
  fee_mensual_cop: number;
  brand_manager: { id: string; nombre: string };
  mes_programa: number;
  zona: Zona;
  semaforo: Semaforo;
  senales: Senal[];
  accion: AccionSugerida | null;
}

export interface Resumen {
  cuentas: number;
  en_parte_plana: number;
  rojas: number;
  ambar: number;
  sin_lectura: number;
  mensualidad_en_riesgo_cop: number;
  mensualidad_ambar_cop: number;
}

export interface Panorama {
  hoy: string;
  resumen: Resumen;
  cuentas: CuentaEvaluada[];
}

export interface CargaBM {
  id: string;
  nombre: string;
  email: string;
  capacidad_max: number;
  cuentas: number;
  rojas: number;
  ambar: number;
  sin_lectura: number;
  verdes: number;
  mensualidad_cop: number;
  mensualidad_en_riesgo_cop: number;
  sobrecargado: boolean;
  con_holgura: boolean;
  cuentas_ids: string[];
  accion: AccionSugerida | null;
}

export interface Metricas {
  leido_en: string | null;
  toques_acumulados: number;
  publicaciones_30d: number;
  cadencia_pct: number | null;
  impresiones_30d: number;
  impresiones_primeros_30d: number;
  alcance_fuera_de_red_total: number;
  pct_fuera_de_red_actual: number;
  pct_fuera_de_red_inicial: number;
  conversaciones_30d: number;
  conversaciones_primeras_30d: number;
  conversaciones_total: number;
  nuevos_seguidores_total: number;
  serie_semanal: { semana: string; publicaciones: number; impresiones: number; pct_fuera_de_red: number; conversaciones: number }[];
  publicaciones: Publicacion[];
}
