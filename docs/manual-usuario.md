# Manual de usuario · Radar · Interés compuesto a la vista

Todo lo que ves en la demo es información inventada (datos de demostración). Este manual explica, por rol, qué mirar y qué hacer.

## Lo básico para todos

- **Semáforo.** **Prioridad esta semana** (rojo): hay que mostrar lo acumulado. **Mirar de cerca** (ámbar): conviene revisarla. **Avanzando** (verde): todo lo que se pudo leer va bien. **Sin lectura**: falta un dato; no es "Avanzando" y no es cero, es "no lo sabemos". Si una fuente crítica no leyó, la cuenta dice "Sin lectura" en vez de "Avanzando". Con datos simulados, el radar trata esos datos como si fueran reales: la etiqueta "Datos simulados" lo recuerda.
- **Tema administrativo.** La factura vencida se muestra como tema administrativo y, por sí sola, nunca pone una cuenta en "Prioridad esta semana": hace falta al menos una señal que no sea de facturación.
- **Parte plana (tramo plano de la curva).** Los meses 2 a 5, cuando lo acumulado todavía no se nota y conviene que el cliente lo vea antes de renovar.
- Cada señal dice **de qué herramienta sale y cuándo se leyó**.
- La IA solo redacta borradores. Nada llega a un cliente sin que una persona lo apruebe.

## CEO (Pedro)

1. Abre el **Brief** cada lunes: cuántas cuentas están en la parte plana y cuáles son prioridad esta semana.
2. Lee las **tres acciones** con su dueño. Si dice Pedro, es tuya (por ejemplo, una llamada a un cliente con dudas y renovación cerca).
3. En **Equipo** mira quién está sobrecargado y si conviene redistribuir cuentas.
4. Para una duda puntual, usa **Preguntar** ("¿cómo va Andina Seguros?") en vez de escribir por WhatsApp.
5. En la **calculadora** del inicio pon tus propios números para ver cuánto vale anticipar una renovación. Empieza vacía a propósito.

## Brand manager

1. Entra a **Cuentas** y filtra por las de prioridad esta semana o por la parte plana.
2. Abre la cuenta: verás la curva de lo acumulado (publicaciones, alcance fuera de la red, conversaciones) y las señales.
3. Pulsa **generar nota de avance**: el borrador usa los números de tu cliente.
4. En la **Bandeja** léela, edítala con tu voz y **apruébala o descártala**. El envío al cliente lo haces tú; el radar no envía nada.
5. Si el radar dice "sin lectura" en una cuenta tuya, avisa a Operaciones.

## Administración

1. En el Brief y en Cuentas busca la acción **"Recordatorio amable de pago"**: aparece cuando hay una factura vencida sin otras señales.
2. Envía el recordatorio con el tono de siempre; el radar no envía nada por ti.
3. Cada semana, exporta las facturas de tu programa contable a CSV y súbelas en **Más → Importar facturas**. Verás cuántas cuentas se emparejaron y si algún semáforo cambió. Si te equivocas de archivo, **Deshacer importación**.
4. Si hay clientes "sin emparejar", revisa que el nombre en el CSV se parezca al de la empresa.

## Operaciones

1. Revisa **Fuentes** cada lunes: modo (simulado, real o real por CSV), última lectura y disponibilidad ("probable" o "a confirmar").
2. Cuando una cuenta queda **sin lectura**, la acción dice "Revisar conector": mira cuál fuente falló y sigue la guía de esa fuente (credenciales, exportación).
3. Si la IA no responde, el radar usa plantillas solo. Si Slack falla, el brief se muestra como vista previa. En ambos casos se puede seguir trabajando.
4. Los umbrales del semáforo se ajustan en `config/umbrales.ts`; el detalle técnico está en `radar/README.md`.

## Calibración

Los umbrales son **puntos de partida**, no verdades. Para calibrarlos:

1. Elige las **5 cuentas que mejor conoce el equipo** (dos que van bien, dos difíciles y una dudosa) y anota cómo las verías tú.
2. Compara con lo que dice el radar en **Cuentas**. Si una cuenta que sabes complicada sale "Avanzando", o una tranquila sale "Prioridad esta semana", hay un umbral por ajustar.
3. Cambia los valores en `config/umbrales.ts`: `aprobacion` (días sin aprobar), `pendientes` (posts sin aprobar), `cadencia` (porcentaje publicado vs pactado), `reunion` (días sin reunión), `frases` (palabras de duda y cuáles son explícitas), `factura` (días vencida), `renovacion` (días a renovar) y `semaforo` (cuántas señales hacen cada color).
4. Reinicia la app y repite hasta que las 5 cuentas coincidan con tu criterio. Conviene revisarlo cada trimestre.
