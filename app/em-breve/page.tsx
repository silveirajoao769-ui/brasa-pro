import Link from "next/link";

type PageProps = {
  searchParams: Promise<{ feature?: string }>;
};

export const dynamic = "force-dynamic";

export default async function ComingSoonPage({ searchParams }: PageProps) {
  const { feature } = await searchParams;
  const name = feature?.trim() || "Este recurso";

  return (
    <main className="system-state-page coming-soon-page">
      <div className="system-state-card coming-soon-card">
        <span className="system-state-icon">🔥</span>
        <span className="eyebrow">EM BREVE</span>
        <h1>{name} está chegando.</h1>
        <p>
          Estamos preparando essa área para entrar no ar com uma experiência completa, em vez de liberar um recurso vazio.
        </p>
        <div className="system-state-actions">
          <Link href="/dashboard" className="primary-button">Voltar ao Dashboard</Link>
          <Link href="/suporte" className="ghost-button">Falar com o suporte</Link>
        </div>
      </div>
    </main>
  );
}
