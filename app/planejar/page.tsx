import Link from "next/link";
import QuickPlanner from "@/components/QuickPlanner";

export default function PlanejarPage() {
  return (
    <main className="standalone-page">
      <div className="shell standalone-nav">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PLANEJAMENTO INTELIGENTE</small></span>
        </Link>
        <div className="detail-actions"><Link href="/ia-brasa" className="ghost-button">✦ Usar IA Brasa</Link><Link href="/dashboard" className="ghost-button">Ir para o dashboard</Link></div>
      </div>

      <section className="shell planner-workspace">
        <div className="section-heading">
          <span className="eyebrow">NOVO CHURRASCO</span>
          <h1>Comece pelo básico. A gente calcula o resto.</h1>
          <p>
            Esta é a primeira versão funcional do nosso planejador. Depois vamos acrescentar
            adultos, crianças, duração, cortes, bebidas, restrições e fornecedores.
          </p>
        </div>
        <QuickPlanner />

        <div className="next-build-card">
          <div>
            <span className="eyebrow">PRÓXIMA EVOLUÇÃO</span>
            <h2>Planejamento detalhado</h2>
            <p>Adultos e crianças · duração · cortes · bebidas · acompanhamentos · lista de compras.</p>
          </div>
          <span className="build-badge">EM CONSTRUÇÃO</span>
        </div>
      </section>
    </main>
  );
}
