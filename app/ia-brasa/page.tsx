import Link from "next/link";
import { redirect } from "next/navigation";
import AIPlanner from "@/components/AIPlanner";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IABrasaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <main className="ai-brasa-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>IA BRASA</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/planejar" className="ghost-button">Calculadora</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell ai-brasa-content">
        <div className="ai-brasa-hero">
          <span className="eyebrow">PLANEJAMENTO EM LINGUAGEM NATURAL</span>
          <h1>Você fala do churrasco. A Brasa monta o plano.</h1>
          <p>
            Escreva como falaria com um churrasqueiro: convidados, orçamento, cortes,
            duração e preferências. O Brasa Pro transforma o pedido em quantidades e compras.
          </p>
        </div>

        <AIPlanner />
      </section>
    </main>
  );
}
