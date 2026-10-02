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
        <div className="detail-actions">
          <Link href="/ia-brasa?mode=planner" className="ghost-button">✦ IA Brasa</Link>
          <Link href="/dashboard" className="ghost-button">Ir para o dashboard</Link>
        </div>
      </div>

      <section className="shell planner-workspace">
        <div className="section-heading">
          <span className="eyebrow">NOVO CHURRASCO</span>
          <h1>Comece pelo básico. A gente calcula o resto.</h1>
          <p>
            Informe convidados, duração, orçamento e preferências. O Brasa Pro calcula quantidades
            e organiza a lista de compras para você.
          </p>
        </div>
        <QuickPlanner />

        <div className="next-build-card">
          <div>
            <span className="eyebrow">QUER DESCREVER EM TEXTO?</span>
            <h2>Planeje com a IA Brasa</h2>
            <p>Escreva como imagina o churrasco e deixe a IA interpretar suas preferências antes do motor calcular as quantidades.</p>
          </div>
          <Link href="/ia-brasa?mode=planner" className="primary-button compact">Abrir IA Brasa →</Link>
        </div>
      </section>
    </main>
  );
}
