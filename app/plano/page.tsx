import Link from "next/link";
import { redirect } from "next/navigation";
import UpgradeButton from "@/components/UpgradeButton";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActivePro } from "@/lib/subscription";

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
  "Agenda, prazos e checklist operacional",
  "Custos, lucro e margem",
  "Cobranças, sinal e contas a receber",
  "Orçamentos com aprovação online",
  "Contrato digital com aceite eletrônico",
  "Estoque e movimentações",
  "Fornecedores e comparador de preços",
  "Portal de fornecedor",
];

type PageProps = {
  searchParams: Promise<{ feature?: string }>;
};

export default async function PlanPage({ searchParams }: PageProps) {
  const { feature } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const subscription = await getSubscription(supabase, user.id);
  const isPro = isActivePro(subscription);
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

        {!isPro && feature && (
          <div className="billing-note">
            <span>🔒</span>
            <div>
              <b>{feature} é um recurso do plano Pro</b>
              <p>Assine o Brasa Pro para liberar esta área e os demais recursos profissionais.</p>
            </div>
          </div>
        )}

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
              A assinatura é processada pela Cakto. Use no checkout o mesmo e-mail da sua conta Brasa Pro
              para que o acesso seja liberado automaticamente após a aprovação do pagamento.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
