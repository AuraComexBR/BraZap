import Link from "next/link";

export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem" }}>
      <h1>BraZap</h1>
      <p>Plataforma de atendimento via WhatsApp Business API.</p>
      <Link href="/login">Entrar</Link>
    </main>
  );
}
