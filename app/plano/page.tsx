import Link from "next/link";
import { redirect } from "next/navigation";
import UpgradeButton from "@/components/UpgradeButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const freeFeatures = [
  "Calculadora de churrasco",
  "Planejamentos salvos",
  "Lista de compras",
  "Receitas e fichas técnicas",
  "Marketplace de fornecedores",
];

const proFeatures = [
  "Tudo do plano Free",
  "Clientes e CRM",
  "Eventos profissionais",
  "Custos, lucro e margem",
  "Orçamentos com aprovação online",
  "Estoque e movimentações",
  "Fornecedores e comparador de preços",
  "Portal de fornecedor",
];

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status, provider, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const plan = subscription?.plan || "free";
  const isPro = plan === "pro" && subscription?.status === "active";
  const checkoutUrl = process.env.NEXT_PUBLIC_CAKTO_CHECKOUT_URL || "https://pay.cakto.com.br/6pdqeej_1163437";

  return (
    <main className="plan-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PLANOS</small></span>
        </Link>
        <Link href="/dashboard" className="ghost-button">← Dashboard</Link>
      </div>

      <section className="shell plan-content">
        <div className="plan-hero">
          <span className="eyebrow">SEU PLANO</span>
          <h1>{isPro ? "Você está no Brasa Pro." : "Comece grátis. Evolua quando fizer sentido."}</h1>
          <p>
            O plano Free cobre o churrasco do dia a dia. O Pro libera a operação profissional completa.
          </p>
        </div>

        <div className="current-plan-card">
          <div>
            <small>PLANO ATUAL</small>
            <strong>{isPro ? "PRO" : "FREE"}</strong>
            <span>Status: {subscription?.status || "active"}</span>
          </div>
          {isPro ? (
            <span className="current-plan-badge">ATIVO</span>
          ) : (
            <span className="current-plan-badge free">GRÁTIS</span>
          )}
        </div>

        <div className="plan-grid">
          <article className="plan-card">
            <span className="plan-tag">FREE</span>
            <h2>Para organizar seus churrascos</h2>
            <div className="plan-price">
              <strong>R$ 0</strong>
              <small>/mês</small>
            </div>
            <div className="plan-feature-list">
              {freeFeatures.map((feature) => <span key={feature}>✓ {feature}</span>)}
            </div>
            <div className="plan-current-button">Seu plano inicial</div>
          </article>

          <article className="plan-card featured">
            <span className="plan-tag">PRO</span>
            <h2>Para quem trabalha com churrasco</h2>
            <div className="plan-price">
              <strong>R$ 39,90</strong>
              <small>/mês</small>
            </div>
            <div className="plan-feature-list">
              {proFeatures.map((feature) => <span key={feature}>✓ {feature}</span>)}
            </div>

            {isPro ? (
              <div className="plan-current-button pro">Plano Pro ativo</div>
            ) : (
              <UpgradeButton checkoutUrl={checkoutUrl} accountEmail={user.email || ""} />
            )}
          </article>
        </div>

        <div className="billing-note">
          <span>💳</span>
          <div>
            <b>Assinatura recorrente</b>
            <p>
              O checkout foi preparado para Mercado Pago. A cobrança só será liberada quando as credenciais
              de produção estiverem configuradas no ambiente.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
