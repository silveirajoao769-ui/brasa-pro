import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default async function FinancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Financeiro profissional");

  const [{ data: events }, { data: quotes }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status, created_at")
      .eq("user_id", user.id)
      .order("event_date", { ascending: false }),
    supabase
      .from("quotes")
      .select("id, event_id, status, price_total, total_cost, margin_percent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const eventIds = (events || []).map((event) => event.id);
  const { data: costs } = eventIds.length
    ? await supabase
        .from("event_costs")
        .select("id, event_id, category, amount")
        .in("event_id", eventIds)
    : { data: [] };

  const costByEvent = new Map<string, number>();
  for (const cost of costs || []) {
    costByEvent.set(
      cost.event_id,
      (costByEvent.get(cost.event_id) || 0) + Number(cost.amount || 0),
    );
  }

  const rows = (events || []).map((event) => {
    const revenue = Number(event.revenue || 0);
    const totalCost = costByEvent.get(event.id) || 0;
    const profit = revenue - totalCost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    return { ...event, revenue, totalCost, profit, margin };
  });

  const totalRevenue = rows.reduce((sum, event) => sum + event.revenue, 0);
  const totalCosts = rows.reduce((sum, event) => sum + event.totalCost, 0);
  const totalProfit = totalRevenue - totalCosts;
  const totalMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const approvedQuotes = (quotes || []).filter((quote) => quote.status === "approved");
  const sentQuotes = (quotes || []).filter((quote) => quote.status === "sent");

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>FINANCEIRO</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">RESULTADO DO NEGÓCIO</span>
            <h1>Financeiro sem planilha.</h1>
            <p>Veja receita, custos, lucro, margem e desempenho de cada evento.</p>
          </div>
          <span className="workspace-count">{rows.length} eventos</span>
        </div>

        <div className="finance-overview">
          <article>
            <small>RECEITA</small>
            <strong>{money(totalRevenue)}</strong>
            <span>Somatório dos eventos</span>
          </article>
          <article>
            <small>CUSTOS</small>
            <strong>{money(totalCosts)}</strong>
            <span>Despesas lançadas</span>
          </article>
          <article className={totalProfit >= 0 ? "finance-positive" : "finance-negative"}>
            <small>LUCRO</small>
            <strong>{money(totalProfit)}</strong>
            <span>{totalMargin.toFixed(1)}% de margem</span>
          </article>
          <article>
            <small>ORÇAMENTOS</small>
            <strong>{approvedQuotes.length} aprovados</strong>
            <span>{sentQuotes.length} aguardando resposta</span>
          </article>
        </div>

        <div className="finance-layout">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>EVENTOS</small><h2>Resultado por evento</h2></div>
            </div>

            {rows.length === 0 ? (
              <div className="compact-empty">
                <span>↗</span>
                <b>Nenhum evento financeiro ainda</b>
                <p>Cadastre um evento e lance os custos para começar.</p>
              </div>
            ) : (
              <div className="finance-event-list">
                {rows.map((event) => (
                  <Link href={"/eventos/" + event.id} className="finance-event-row" key={event.id}>
                    <div>
                      <b>{event.title}</b>
                      <small>{event.guests} convidados · {event.status}</small>
                    </div>
                    <div>
                      <span>Receita</span>
                      <b>{money(event.revenue)}</b>
                    </div>
                    <div>
                      <span>Custos</span>
                      <b>{money(event.totalCost)}</b>
                    </div>
                    <div className={event.profit >= 0 ? "positive" : "negative"}>
                      <span>Lucro</span>
                      <b>{money(event.profit)}</b>
                      <small>{event.margin.toFixed(1)}%</small>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>ORÇAMENTOS</small><h2>Conversão comercial</h2></div>
            </div>

            <div className="finance-funnel">
              <div>
                <span>Criados</span>
                <strong>{quotes?.length || 0}</strong>
              </div>
              <div>
                <span>Aguardando cliente</span>
                <strong>{sentQuotes.length}</strong>
              </div>
              <div>
                <span>Aprovados</span>
                <strong>{approvedQuotes.length}</strong>
              </div>
              <div>
                <span>Recusados</span>
                <strong>{(quotes || []).filter((quote) => quote.status === "rejected").length}</strong>
              </div>
            </div>

            <div className="finance-insight">
              <span>🔥</span>
              <div>
                <small>BRASA PRO</small>
                <b>Custos completos = margem confiável.</b>
                <p>Quanto melhor você lança carnes, equipe, transporte e extras, mais real fica o lucro mostrado aqui.</p>
              </div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
