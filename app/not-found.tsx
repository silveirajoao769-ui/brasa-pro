import Link from "next/link";

export default function NotFound() {
  return (
    <main className="system-state-page">
      <div className="system-state-card">
        <span className="system-state-icon">🔥</span>
        <span className="eyebrow">404 · ROTA NÃO ENCONTRADA</span>
        <h1>Essa brasa não acendeu.</h1>
        <p>
          A página pode ter mudado, expirado ou o endereço foi digitado incorretamente.
        </p>
        <div className="system-state-actions">
          <Link href="/dashboard" className="primary-button">Ir para o Dashboard</Link>
          <Link href="/" className="ghost-button">Página inicial</Link>
        </div>
      </div>
    </main>
  );
}
