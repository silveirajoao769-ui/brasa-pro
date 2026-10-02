import Link from "next/link";
import { redirect } from "next/navigation";
import AIPlanner from "@/components/AIPlanner";
import AIBusinessAdvisor from "@/components/AIBusinessAdvisor";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActivePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type AdvisorMode = "business" | "finance" | "event" | "package" | "quote";

type PageProps = {
  searchParams: Promise<{ mode?: string; eventId?: string }>;
};

const proModes = new Set(["business", "finance", "event", "package", "quote"]);

export default async function IABrasaPage({ searchParams }: PageProps) {
  const { mode: rawMode, eventId } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const subscription = await getSubscription(supabase, user.id);
  const isPro = isActivePro(subscription);

  const mode =
    rawMode === "planner"
      ? "planner"
      : proModes.has(String(rawMode))
        ? (rawMode as AdvisorMode)
        : "planner";

  return (
    <main className="workspace-page ai-brasa-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>IA BRASA</small></span>
        </Link>
        <div className="detail-actions">
          <span className={isPro ? "current-plan-badge" : "current-plan-badge free"}>
            {isPro ? "IA PRO ATIVA" : "MODO LOCAL"}
          </span>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading ai-brasa-heading">
          <div>
            <span className="eyebrow">SEU COPILOTO DO CHURRASCO</span>
            <h1>IA Brasa.</h1>
            <p>
              Planeje churrascos e, no Pro, analise operação, custos, eventos, pacotes e propostas com seus dados reais.
            </p>
          </div>
        </div>

        <nav className="ai-mode-tabs" aria-label="Modos da IA Brasa">
          <Link className={mode === "planner" ? "active" : ""} href="/ia-brasa?mode=planner">Planejamento</Link>
          <Link className={mode === "business" ? "active" : ""} href="/ia-brasa?mode=business">Negócio <small>PRO</small></Link>
          <Link className={mode === "finance" ? "active" : ""} href="/ia-brasa?mode=finance">Financeiro <small>PRO</small></Link>
          <Link className={mode === "event" ? "active" : ""} href="/ia-brasa?mode=event">Evento <small>PRO</small></Link>
          <Link className={mode === "package" ? "active" : ""} href="/ia-brasa?mode=package">Pacotes <small>PRO</small></Link>
          <Link className={mode === "quote" ? "active" : ""} href="/ia-brasa?mode=quote">Orçamento <small>PRO</small></Link>
        </nav>

        {mode === "planner" ? (
          <>
            {!isPro && (
              <div className="ai-local-banner">
                <span>✦</span>
                <div>
                  <b>Você está usando o modo inteligente local.</b>
                  <p>Os cálculos continuam funcionando sem custo. O plano Pro libera interpretação pela IA conectada.</p>
                </div>
                <Link href="/plano?feature=IA%20Brasa%20Pro" className="ghost-button">Conhecer Pro</Link>
              </div>
            )}
            <AIPlanner />
          </>
        ) : !isPro ? (
          <div className="ai-pro-lock">
            <span>✦</span>
            <h2>Análises profissionais fazem parte do Pro.</h2>
            <p>
              A IA Brasa Pro pode ler seus números operacionais, analisar margem, custos, eventos, pacotes e ajudar a preparar propostas.
            </p>
            <Link href="/plano?feature=IA%20Brasa%20Pro" className="primary-button">Liberar IA Brasa Pro →</Link>
          </div>
        ) : (
          <AIBusinessAdvisor
            mode={mode}
            eventId={eventId || null}
          />
        )}
      </section>
    </main>
  );
}
