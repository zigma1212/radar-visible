<!-- radar/README.md · Radar · Interés compuesto a la vista · todos los datos de la demo son inventados -->
# Radar · Interés compuesto a la vista

> **Demo en línea:** https://radar-visible.vercel.app (protegida con usuario y clave, que van en la entrega; modo plantilla, sin clave de IA).
>
> **Para verlo en tu máquina en dos minutos:** `npm install && npm run dev` y abrir http://localhost:3000. Empieza por **/diagnostico** (el porqué) y sigue con el botón "Ver el radar funcionando". Detalle en [Arranque en 3 comandos](#arranque-en-3-comandos). Todos los datos son inventados.

## Para el equipo de Visible (sin tecnicismos)

### Qué es

Pedro lo dice así: "Cada publicación deja un rastro de confianza que ninguna métrica registra". El valor de Visible se acumula despacio y en silencio, y hoy ese rastro no lo ve ni el cliente ocupado ni el CEO a tiempo.

El Radar junta en una pantalla las pistas que ya existen en cinco herramientas (Notion, Circleback, Magnettü, Siigo, Pipedrive) y responde una pregunta cada lunes: **en qué cuentas hay que mostrar lo acumulado antes de la renovación, y quién lo hace**. La IA solo redacta borradores; las personas deciden y envían. Nada llega a un cliente sin aprobación.

Funciona con lo mínimo (Siigo + Pipedrive) y gana precisión con cada fuente que se sume. Si una fuente crítica no leyó, la cuenta dice **"Sin lectura"** en vez de **"Avanzando"**. Con datos simulados, el radar trata esos datos como si fueran reales: la etiqueta "Datos simulados" lo recuerda.

Esta versión es una demo: las cuentas, los nombres y las cifras son inventados, salvo lo que se importe desde un CSV (ver más abajo).

### Cómo se usa cada semana

1. Abrir el **Brief** (página de inicio): resumen, curva y tres acciones con dueño.
2. Entrar a las cuentas de "Prioridad esta semana" y "Mirar de cerca"; cada señal dice de qué fuente sale y cuándo se leyó.
3. Si hay que mostrarle al cliente lo acumulado, generar la **nota de avance**, editarla y aprobarla en la Bandeja.
4. Dudas puntuales: **Preguntar**.

El manual por rol está en `docs/manual-usuario.md`. La página **Ayuda** dentro de la app trae la versión corta.

### Importar facturas desde un CSV (la primera fuente real)

1. Menú **Más → Importar facturas** (o `/importar`).
2. Sube el CSV que exporta tu programa contable. Columnas: `cliente, numero, emitida, vence, valor, estado`. También sirven los encabezados de Siigo (`Cliente, Número, Fecha, Vencimiento, Total, Estado`), con o sin tildes y en mayúsculas o minúsculas. Separador coma, punto y coma o tabulador. Fechas `AAAA-MM-DD` o `DD/MM/AAAA`. Estados: pagada, pendiente, vencida (las anuladas se saltan).
3. Ejemplo para probar: botón **Descargar ejemplo** (`data/ejemplos/facturas-ejemplo.csv`). Con la fecha por defecto, hace pasar a Educa Horizonte de "Avanzando" a "Mirar de cerca" por una factura vencida.
4. La pantalla muestra filas leídas, clientes emparejados, los que no se pudieron emparejar y los cambios de semáforo.
5. **Deshacer importación** devuelve Siigo a los datos simulados.

Detalles: los nombres se emparejan con la empresa o el nombre del cliente sin importar tildes, mayúsculas ni sufijos como S.A.S. o Ltda; si un nombre es ambiguo o no se parece a ninguna cuenta, se ignora y se avisa (no se adivina). Las facturas importadas reemplazan a las simuladas solo de las cuentas emparejadas. La fuente Siigo pasa a "Real (CSV)" y su fecha de lectura es la del momento de importar. Se guarda en `.data/estado.json`.

### Si algo falla

| Situación | Qué hacer |
|---|---|
| Una cuenta aparece **"sin lectura"** | Es honesto: falta un dato clave (Notion, Magnettü o Siigo). Ir a **Fuentes**, ver cuál conector tiene "sin lectura" o fecha vieja y revisar su credencial o exportación. Si es una cuenta nueva sin publicaciones, es normal las primeras semanas. |
| Una fuente entera no lee | La app sigue funcionando con las demás y marca "sin lectura" solo donde esa fuente hacía falta. Corregir el conector (ver "De simulado a real") y recargar. |
| La **IA falla** o no hay clave | El brief, las notas y las respuestas usan **plantillas** automáticamente (la etiqueta dice "Plantilla" en lugar de "Redactado con IA"). No hay que hacer nada para seguir trabajando. |
| **Slack** falla o no está conectado | El botón "Enviar a Slack" muestra una **vista previa** y nada sale. Revisar el webhook y volver a intentar. |
| La importación de CSV dice que faltan columnas | Revisar que el encabezado tenga cliente, vence y valor (los demás son opcionales). Ver el ejemplo descargable. |
| La fecha de la demo no es la de hoy | Ver "Fecha de la demo" abajo. |

### Primer día con datos reales (checklist)

Qué pedir o exportar de cada herramienta, en este orden (Siigo y Pipedrive dan el mínimo útil):

- [ ] **Siigo**: exportar a CSV las facturas de venta con cliente, número, fecha, vencimiento, total y estado; importarlas en `/importar`. Verificar que los clientes queden emparejados.
- [ ] **Pipedrive**: lista de negocios de cada cuenta activa con etapa y **fecha de renovación** (o cómo se registra la renovación en programas corporativos y cohortes).
- [ ] **Notion**: base "Clientes" (cuenta, brand manager, plan, fecha de inicio, posts pactados) y base "Calendario" (post, fecha de envío al cliente, fecha de aprobación). Antes: confirmar si los clientes aprueban ahí o por WhatsApp.
- [ ] **Circleback**: confirmar si se graban reuniones con clientes; si sí, exportar resúmenes de los últimos tres meses.
- [ ] **Magnettü**: confirmar qué métricas exporta por cliente (impresiones, alcance fuera de red, conversaciones); si no hay API, una exportación periódica sirve.
- [ ] **Slack**: crear un webhook entrante para el canal del brief.
- [ ] Ajustar los **umbrales** a la realidad de Visible (`config/umbrales.ts`).
- [ ] Validar durante 30 minutos con una persona de cada rol si el brief le sirve.

Las preguntas a confirmar están también en la pantalla **Fuentes**.

---

## Sección técnica

### Arranque en 3 comandos

```bash
npm install
npm run seed   # regenera los datos simulados en data/mock/*.json (determinista)
npm run dev    # http://localhost:3000
```

Otros: `npm test` (Vitest), `npm run lint`, `npm run build`, `npm start`.

Stack: Next.js 16 (App Router), TypeScript, Tailwind v4, Vitest. El motor (`lib/motor/*`) es puro y determinista; la IA (`lib/ia/*`) solo redacta hechos ya calculados y tiene plantilla de respaldo.

### Variables de entorno

Solo nombres; los valores nunca se guardan en el repositorio. La lista con comentarios está en `radar/.env.example`: copiarlo a un archivo local de variables y completar lo que se use. Todas son opcionales: sin ellas la app corre en modo demo.

| Variable | Para qué |
|---|---|
| `DEMO_TODAY` | Fecha "de hoy" de la demo, `AAAA-MM-DD` (por defecto `2026-10-05`). |
| `IA_PROVEEDOR` | Proveedor de IA a usar (Anthropic u OpenAI). Sin credencial, se usan plantillas. |
| `ANTHROPIC_MODEL`, `OPENAI_MODEL` | Modelo del proveedor elegido. La credencial del proveedor va en la variable estándar de su SDK (ver `radar/.env.example`). |
| `SLACK_WEBHOOK_URL` | Webhook entrante para enviar el brief. Sin él, vista previa. |
| `SLACK_MENCIONES` | `Nombre=IDdeMiembro` separados por coma. El brief menciona con @ a cada responsable y Slack le avisa; sin ID, el nombre va en negrita. |
| `DEMO_USUARIO`, `DEMO_CLAVE` | Si ambas existen, la app pide usuario y clave (autenticación básica, `proxy.ts`). Vacías = acceso libre (uso local). |
| `RADAR_DATA_DIR` | Carpeta del estado (notas, auditoría, facturas importadas). Por defecto `.data/`; en Vercel, `/tmp/radar-data` (se reinicia cuando la instancia se recicla). |
| `NOTION_TOKEN`, `NOTION_DB_CLIENTES`, `NOTION_DB_CALENDARIO` | Previstas para el conector real de Notion. |
| `SIIGO_USER`, `SIIGO_ACCESS_KEY` | Previstas para el conector real de Siigo. |
| `PIPEDRIVE_API_TOKEN`, `PIPEDRIVE_DOMINIO` | Previstas para el conector real de Pipedrive. |

### Fecha de la demo (`DEMO_TODAY`)

Toda la app (motor, brief, curva, encabezados) toma "hoy" de `lib/fecha.ts`, que lee `DEMO_TODAY` y, si no existe, usa **2026-10-05** (un lunes). Para grabar el día real, definirla antes de arrancar y volver a sembrar para que los datos simulados sean relativos a ese día:

```bash
DEMO_TODAY=2026-10-12 npm run seed
DEMO_TODAY=2026-10-12 npm run dev
```

Sin cambiar nada, todo queda en el 5 de octubre de 2026. Los sellos de tiempo de las importaciones CSV y de las notas usan el día de la demo con la hora real, para que todo cuadre con "hoy".

### Cambiar los umbrales

Todas las reglas del semáforo (días sin aprobar, cadencia, reuniones, facturas, renovación, cuándo es "Prioridad esta semana" o "Mirar de cerca") están en **`config/umbrales.ts`**, con comentarios. Se cambia un número y se reinicia; no hay que tocar nada más. Después, `npm test` confirma que las reglas siguen coherentes.

**Calibración.** Los umbrales son puntos de partida. Toma las 5 cuentas mejor conocidas del equipo, compara su semáforo con tu criterio y ajusta en `config/umbrales.ts`: `aprobacion`, `pendientes`, `cadencia`, `reunion`, `frases`, `factura`, `renovacion` y `semaforo`. Reglas fijas: la factura vencida es un tema administrativo y por sí sola nunca pone una cuenta en "Prioridad esta semana"; "presupuesto" o "no tengo tiempo" solas son "Mirar de cerca", y solo "pausar", "cancelar", "no veo resultados" o dos o más frases de duda cuentan como señal seria.

### De simulado a real: dónde está cada conector

Cada conector es `lib/conectores/<fuente>.ts` con una función `leer()`. Hoy devuelven datos de `data/mock/`. Al final de cada archivo hay un bloque de comentarios "CONEXIÓN REAL (pendiente)" con el endpoint, el mapeo de campos, las variables previstas y los TODO:

- `lib/conectores/notion.ts`: bases Clientes y Calendario.
- `lib/conectores/circleback.ts`: webhook o exportación de reuniones.
- `lib/conectores/magnettu.ts`: exportación de métricas por publicación.
- `lib/conectores/siigo.ts`: API de facturas de venta. Ya prefiere las facturas importadas por CSV (`lib/importar/`, almacén en `lib/estado/`).
- `lib/conectores/pipedrive.ts`: negocios y fecha de renovación.
- `lib/conectores/index.ts`: reúne las fuentes; si una falla queda `null` y el motor la marca "sin lectura".
- `lib/slack.ts`: envío del brief (vista previa sin webhook).

Regla al conectar: devolver `Lectura<T>` con `modo: "real"` y `leido_en` real. Los metadatos de cada fuente (disponibilidad y pregunta a validar) viven en `data/mock/fuentes.json`, generado por `scripts/seed.ts`; si se re-siembra, se conservan.

### Importación CSV: piezas

- `lib/importar/facturas.ts`: parser, mapeo de encabezados, validación, emparejamiento difuso (puro, con tests).
- `lib/importar/servicio.ts`: guarda la importación, recalcula el panorama y compara semáforos.
- `app/api/importar/route.ts`: `GET` estado, `POST` (JSON `{csv, archivo}` o CSV crudo), `DELETE` deshacer. `app/api/importar/ejemplo/route.ts` sirve el ejemplo.
- `app/importar/page.tsx` + `components/importar-facturas.tsx`: pantalla.

### Estructura rápida

```
config/umbrales.ts        reglas del semáforo
lib/motor/                señales, semáforo, acciones (puro)
lib/conectores/           fuentes (simuladas hoy)
lib/ia/                   brief, nota, preguntar + plantillas
lib/importar/             importación CSV
lib/estado/               notas, auditoría, importación (.data/)
data/mock, data/ejemplos  datos simulados y CSV de ejemplo
docs/manual-usuario.md    manual por rol
```
