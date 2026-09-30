import Link from "next/link";
import { SemaforoPill } from "@/components/ui";

export default function Ayuda() {
  return (
    <div className="page" style={{ maxWidth: 720 }}>
      <header>
        <p className="eyebrow">Manual corto</p>
        <h1 className="h1">Cómo usar el Radar</h1>
        <p className="muted" style={{ marginTop: 6 }}>Pensado para quien no es técnico. Cinco minutos y ya.</p>
      </header>

      <section className="card grid gap-2">
        <h2 className="h2">Qué es</h2>
        <p>El valor que se va acumulando en cada cuenta casi no se ve, y las pistas para verlo viven en herramientas distintas: si aprueba contenido, si hubo reunión, cuánto se publica, si pagó, cuándo renueva. El Radar las junta y te dice, cada lunes, en qué cuentas hay que mostrar lo acumulado antes de la renovación y quién debe hacer qué.</p>
        <p>Está pensado para la <strong>parte plana</strong>: los meses 2 a 5, cuando lo acumulado todavía no se nota y conviene que el cliente lo vea antes de renovar.</p>
      </section>

      <section className="card grid gap-3">
        <h2 className="h2">Cómo leer el semáforo</h2>
        <div className="grid gap-2">
          <p className="flex flex-wrap items-center gap-2"><SemaforoPill s="rojo" /> Hay señales serias de contenido, reuniones o renovación. Alguien tiene que actuar esta semana. Una factura vencida sola no la pone aquí: es un tema administrativo y se muestra aparte.</p>
          <p className="flex flex-wrap items-center gap-2"><SemaforoPill s="ambar" /> Hay avisos. Conviene mirarla de cerca, todavía no es urgente.</p>
          <p className="flex flex-wrap items-center gap-2"><SemaforoPill s="verde" /> Todo lo que pudimos leer va avanzando bien.</p>
          <p className="flex flex-wrap items-center gap-2"><SemaforoPill s="sin_lectura" /> Falta un dato clave.</p>
        </div>
      </section>

      <section className="card grid gap-2">
        <h2 className="h2">Qué significa &quot;sin lectura&quot;</h2>
        <p>Que una fuente no respondió o todavía no tiene datos de esa cuenta (por ejemplo, una cuenta nueva en Magnettü). <strong>No es verde y no es cero</strong>: es &quot;no lo sabemos&quot;. Si una fuente crítica no leyó, la cuenta dice &quot;Sin lectura&quot; en vez de &quot;Avanzando&quot;. Con datos simulados, el radar trata esos datos como si fueran reales: la etiqueta &quot;Datos simulados&quot; lo recuerda. Se resuelve revisando el conector en <Link href="/fuentes" style={{ textDecoration: "underline" }}>Fuentes</Link>.</p>
      </section>

      <section className="card grid gap-2">
        <h2 className="h2">Calibración</h2>
        <p>Los umbrales son <strong>puntos de partida</strong>, no verdades. Antes de confiar en el semáforo, contrástalo con las cuentas que mejor conoces:</p>
        <ol style={{ paddingLeft: 20 }} className="grid gap-2">
          <li>Elige las 5 cuentas que mejor conoce el equipo (por ejemplo, dos que van bien, dos difíciles y una dudosa) y anota cómo las verías tú.</li>
          <li>Compara con lo que dice el radar en <Link href="/cuentas" style={{ textDecoration: "underline" }}>Cuentas</Link>. Si una que sabes complicada sale &quot;Avanzando&quot;, o una tranquila sale &quot;Prioridad esta semana&quot;, hay un umbral por ajustar.</li>
          <li>Ajusta los valores en <code>config/umbrales.ts</code>: <code>aprobacion</code> (días sin aprobar), <code>pendientes</code> (posts sin aprobar), <code>cadencia</code> (porcentaje publicado), <code>reunion</code> (días sin reunión), <code>frases</code> (palabras de duda), <code>factura</code> (días vencida), <code>renovacion</code> (días a renovar) y <code>semaforo</code> (cuántas señales hacen cada color).</li>
          <li>Reinicia la app y repite hasta que las 5 cuentas coincidan con tu criterio. Repite cada trimestre.</li>
        </ol>
      </section>

      <section className="card grid gap-2">
        <h2 className="h2">Qué hacer cada lunes</h2>
        <ol style={{ paddingLeft: 20 }} className="grid gap-2">
          <li>Abre el <Link href="/" style={{ textDecoration: "underline" }}>Brief</Link> (cuando Slack esté conectado, podría llegarte cada lunes a las 7 a. m.).</li>
          <li>Lee las tres acciones. Cada una tiene un dueño: si es tuya, hazla; si es de otra persona, ya le llegó.</li>
          <li>Entra a <Link href="/cuentas?f=rojas" style={{ textDecoration: "underline" }}>las cuentas prioritarias</Link> y revisa cada señal: siempre dice de dónde salió y cuándo se leyó.</li>
          <li>Si hay que escribirle al cliente, genera la nota de avance y revísala en la <Link href="/bandeja" style={{ textDecoration: "underline" }}>Bandeja</Link>.</li>
          <li>Si tienes una duda puntual, pregúntala en <Link href="/preguntar" style={{ textDecoration: "underline" }}>Preguntar</Link>.</li>
        </ol>
      </section>

      <section className="card grid gap-2">
        <h2 className="h2">Quién hace qué</h2>
        <ul style={{ paddingLeft: 20 }} className="grid gap-2">
          <li><strong>Pedro (CEO):</strong> lee el brief, llama a los clientes en duda y decide si se redistribuyen cuentas.</li>
          <li><strong>Brand manager:</strong> revisa, edita y aprueba las notas de avance de sus cuentas. Nada sale al cliente sin su aprobación.</li>
          <li><strong>Administración:</strong> envía el recordatorio amable cuando hay una factura vencida.</li>
          <li><strong>Operaciones:</strong> revisa los conectores cuando una cuenta queda sin lectura.</li>
          <li><strong>La IA:</strong> solo redacta borradores con los datos ya calculados. No decide ni inventa cifras; si no hay clave, usa plantillas.</li>
        </ul>
      </section>

      <p className="small muted">Todo lo que ves en esta demo son datos simulados. Los umbrales del semáforo se cambian en un solo archivo, sin tocar el resto.</p>
    </div>
  );
}
