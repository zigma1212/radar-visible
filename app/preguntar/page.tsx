import { Chat } from "@/components/chat";

export default function Preguntar() {
  return (
    <div className="page">
      <header>
        <p className="eyebrow">Pregunta libre</p>
        <h1 className="h1">¿Cómo va…?</h1>
        <p className="muted" style={{ marginTop: 6 }}>Se acabó el WhatsApp de &quot;¿cómo va X?&quot;.</p>
      </header>
      <Chat />
    </div>
  );
}
