"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <main className="system-state-page">
          <div className="system-state-card">
            <span className="system-state-icon">🔥</span>
            <span className="eyebrow">ERRO INESPERADO</span>
            <h1>Algo saiu da grelha.</h1>
            <p>
              O Brasa Pro encontrou um erro inesperado. Tente novamente sem perder o que já está salvo na sua conta.
            </p>
            <div className="system-state-actions">
              <button className="primary-button" type="button" onClick={() => reset()}>
                Tentar novamente
              </button>
              <a href="/dashboard" className="ghost-button">Dashboard</a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
