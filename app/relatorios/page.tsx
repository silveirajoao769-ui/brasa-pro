import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ period?: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function percent(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value) + "%";
}

function monthKey(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function monthLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR", {
    month: "short",
    year: "2-digit",
  })
    .format(new Date(year, month - 1, 1))
    .replace(".", "")
    .toUpperCase();
}

function lastMonthKeys(months: number) {
  const now = new Date();
  const result: string[] = [];

  for (let index = months - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    result.push(monthKey(date));
  }

  return result;
}

export default async function ReportsPage({ searchParams }: PageProps) {
  const { period } = await searchParams;
  const months = period === "12" ? 12 : 6;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Relatórios profissionais");

  const [
    { data: events },
    { data: quotes },
    { data: payments },
    { data: clients },
    { data: costs },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, client_id, title, event_date, guests, revenue, status, service_package_snapshot, created_at")
      .eq("user_id", user.id),
    supabase
      .from("quotes")
      .select("id, event_id, status, price_total, service_package_id, service_package_snapshot, created_at, responded_at")
      .eq("user_id", user.id),
    supabase
      .from("event_payments")
      .select("id, event_id, amount, status, paid_at, created_at")
      .eq("user_id", user.id),
    supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id),
    supabase
      .from("event_costs")
      .select("id, event_id, amount, category, created_at"),
  ]);

  const eventRows = events || [];
  const quoteRows = quotes || [];
  const paymentRows = payments || [];
  const costRows = costs || [];
  const clientMap = new Map((clients || []).map((client) => [client.id, client.name]));
  const eventMap = new Map(eventRows.map((event) => [event.id, event]));

  const contractedEvents = eventRows.filter((event) =>
    ["approved", "scheduled", "completed"].includes(event.status),
  );

  const contractedIds = new Set(contractedEvents.map((event) => event.id));
  const relevantCosts = costRows.filter((cost) => contractedIds.has(cost.event_id));

  const totalContracted = contractedEvents.reduce(
    (sum, event) => sum + Number(event.revenue || 0),
    0,
  );
  const totalCosts = relevantCosts.reduce(
    (sum, cost) => sum + Number(cost.amount || 0),
    0,
  );
  const totalProfit = totalContracted - totalCosts;
  const weightedMargin = totalContracted > 0
    ? (totalProfit / totalContracted) * 100
    : 0;
  const averageTicket = contractedEvents.length > 0
    ? totalContracted / contractedEvents.length
    : 0;

  const receivedPayments = paymentRows.filter((payment) => payment.status === "paid");
  const totalReceived = receivedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );

  const approvedQuotes = quoteRows.filter((quote) => quote.status === "approved");
  const rejectedQuotes = quoteRows.filter((quote) => quote.status === "rejected");
  const decidedQuotes = approvedQuotes.length + rejectedQuotes.length;
  const quoteConversion = decidedQuotes > 0
    ? (approvedQuotes.length / decidedQuotes) * 100
    : 0;

  const clientStats = new Map<string, {
    contracted: number;
    paid: number;
    events: number;
  }>();

  for (const event of contractedEvents) {
    if (!event.client_id) continue;
    const current = clientStats.get(event.client_id) || {
      contracted: 0,
      paid: 0,
      events: 0,
    };
    current.contracted += Number(event.revenue || 0);
    current.events += 1;
    clientStats.set(event.client_id, current);
  }

  for (const payment of receivedPayments) {
    const event = eventMap.get(payment.event_id);
    if (!event?.client_id) continue;

    const current = clientStats.get(event.client_id) || {
      contracted: 0,
      paid: 0,
      events: 0,
    };
    current.paid += Number(payment.amount || 0);
    clientStats.set(event.client_id, current);
  }

  const topClients = [...clientStats.entries()]
    .map(([clientId, stats]) => ({
      id: clientId,
      name: clientMap.get(clientId) || "Cliente",
      ...stats,
    }))
    .sort((a, b) => b.contracted - a.contracted)
    .slice(0, 6);

  const packageStats = new Map<string, {
    name: string;
    count: number;
    revenue: number;
  }>();

  for (const quote of approvedQuotes) {
    const snapshot = quote.service_package_snapshot as
      | { name?: string; total_price?: number | string }
      | null;

    if (!snapshot?.name) continue;

    const key = snapshot.name;
    const current = packageStats.get(key) || {
      name: key,
      count: 0,
      revenue: 0,
    };

    current.count += 1;
    current.revenue += Number(quote.price_total || snapshot.total_price || 0);
    packageStats.set(key, current);
  }

  const topPackages = [...packageStats.values()]
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .slice(0, 6);

  const keys = lastMonthKeys(months);
  const monthSet = new Set(keys);

  const monthly = new Map(
    keys.map((key) => [
      key,
      { revenue: 0, received: 0, costs: 0, events: 0 },
    ]),
  );

  for (const event of contractedEvents) {
    const sourceDate = event.event_date || event.created_at;
    if (!sourceDate) continue;
    const key = monthKey(sourceDate);
    if (!monthSet.has(key)) continue;

    const row = monthly.get(key)!;
    row.revenue += Number(event.revenue || 0);
    row.events += 1;
  }

  for (const payment of receivedPayments) {
    const sourceDate = payment.paid_at || payment.created_at;
    if (!sourceDate) continue;
    const key = monthKey(sourceDate);
    if (!monthSet.has(key)) continue;

    monthly.get(key)!.received += Number(payment.amount || 0);
  }

  for (const cost of relevantCosts) {
    const event = eventMap.get(cost.event_id);
    const sourceDate = event?.event_date || event?.created_at || cost.created_at;
    if (!sourceDate) continue;
    const key = monthKey(sourceDate);
    if (!monthSet.has(key)) continue;

    monthly.get(key)!.costs += Number(cost.amount || 0);
  }

  const monthlyRows = keys.map((key) => ({
    key,
    label: monthLabel(key),
    ...monthly.get(key)!,
  }));

  const maxMonthlyValue = Math.max(
    1,
    ...monthlyRows.flatMap((row) => [row.revenue, row.received]),
  );

  const categoryCosts = new Map<string, number>();
  for (const cost of relevantCosts) {
    categoryCosts.set(
      cost.category,
      (categoryCosts.get(cost.category) || 0) + Number(cost.amount || 0),
    );
  }

  const topCostCategories = [...categoryCosts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const eventResults = contractedEvents
    .map((event) => {
      const eventCosts = relevantCosts
        .filter((cost) => cost.event_id === event.id)
        .reduce((sum, cost) => sum + Number(cost.amount || 0), 0);

      const revenue = Number(event.revenue || 0);
      const profit = revenue - eventCosts;
      const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

      return {
        id: event.id,
        title: event.title,
        revenue,
        costs: eventCosts,
        profit,
        margin,
      };
    })
    .sort((a, b) => b.profit - a.profit)
    .slice(0, 6);

  return (
    <main className="workspace-page reports-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>RELATÓRIOS</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/financeiro" className="ghost-button">Financeiro</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading reports-heading">
          <div>
            <span className="eyebrow">INDICADORES DO NEGÓCIO</span>
            <h1>Relatórios profissionais.</h1>
            <p>Entenda faturamento, margem, clientes, pacotes e conversão comercial sem depender de planilhas.</p>
          </div>
          <div className="reports-period">
            <Link className={months === 6 ? "active" : ""} href="/relatorios?period=6">6 meses</Link>
            <Link className={months === 12 ? "active" : ""} href="/relatorios?period=12">12 meses</Link>
          </div>
        </div>

        <div className="reports-kpis">
          <article>
            <small>RECEITA CONTRATADA</small>
            <strong>{money(totalContracted)}</strong>
            <span>{contractedEvents.length} eventos contratados</span>
          </article>
          <article className="reports-kpi-green">
            <small>JÁ RECEBIDO</small>
            <strong>{money(totalReceived)}</strong>
            <span>{totalContracted > 0 ? percent((totalReceived / totalContracted) * 100) : "0%"} da receita contratada</span>
          </article>
          <article>
            <small>TICKET MÉDIO</small>
            <strong>{money(averageTicket)}</strong>
            <span>Por evento contratado</span>
          </article>
          <article className={totalProfit >= 0 ? "reports-kpi-green" : "reports-kpi-red"}>
            <small>LUCRO PROJETADO</small>
            <strong>{money(totalProfit)}</strong>
            <span>{percent(weightedMargin)} de margem</span>
          </article>
          <article>
            <small>CONVERSÃO</small>
            <strong>{percent(quoteConversion)}</strong>
            <span>{approvedQuotes.length} aprovadas de {decidedQuotes} respondidas</span>
          </article>
        </div>

        <article className="workspace-panel reports-chart-panel">
          <div className="panel-heading">
            <div><small>EVOLUÇÃO MENSAL</small><h2>Contratado x recebido</h2></div>
            <span className="workspace-count">{months} meses</span>
          </div>

          <div className="reports-chart">
            {monthlyRows.map((row) => (
              <div className="reports-month" key={row.key}>
                <div className="reports-bars">
                  <span
                    className="reports-bar contracted"
                    style={{ height: Math.max(3, (row.revenue / maxMonthlyValue) * 100) + "%" }}
                    title={"Contratado: " + money(row.revenue)}
                  />
                  <span
                    className="reports-bar received"
                    style={{ height: Math.max(3, (row.received / maxMonthlyValue) * 100) + "%" }}
                    title={"Recebido: " + money(row.received)}
                  />
                </div>
                <b>{row.label}</b>
                <small>{row.events} evento(s)</small>
              </div>
            ))}
          </div>

          <div className="reports-chart-legend">
            <span><i className="legend-contract" /> Contratado</span>
            <span><i className="legend-received" /> Recebido</span>
          </div>
        </article>

        <div className="reports-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CLIENTES</small><h2>Quem mais compra</h2></div>
            </div>

            {topClients.length === 0 ? (
              <div className="compact-empty">
                <span>♙</span>
                <b>Sem dados suficientes</b>
                <p>Clientes com eventos contratados aparecerão aqui.</p>
              </div>
            ) : (
              <div className="reports-ranking-list">
                {topClients.map((client, index) => (
                  <Link href={"/clientes/" + client.id} className="reports-ranking-row" key={client.id}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{client.name}</b>
                      <small>{client.events} evento(s) · recebido {money(client.paid)}</small>
                    </div>
                    <strong>{money(client.contracted)}</strong>
                    <em>→</em>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>PACOTES</small><h2>Mais vendidos</h2></div>
            </div>

            {topPackages.length === 0 ? (
              <div className="compact-empty">
                <span>🍖</span>
                <b>Nenhum pacote vendido ainda</b>
                <p>Orçamentos aprovados com pacotes formarão este ranking.</p>
              </div>
            ) : (
              <div className="reports-ranking-list">
                {topPackages.map((item, index) => (
                  <div className="reports-ranking-row" key={item.name}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <b>{item.name}</b>
                      <small>{item.count} venda(s)</small>
                    </div>
                    <strong>{money(item.revenue)}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <div className="reports-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>RENTABILIDADE</small><h2>Eventos com maior lucro</h2></div>
            </div>

            {eventResults.length === 0 ? (
              <div className="compact-empty">
                <span>↗</span>
                <b>Sem eventos contratados</b>
                <p>O ranking aparecerá conforme os eventos ganharem receita e custos.</p>
              </div>
            ) : (
              <div className="reports-event-list">
                {eventResults.map((event) => (
                  <Link href={"/eventos/" + event.id} className="reports-event-row" key={event.id}>
                    <div>
                      <b>{event.title}</b>
                      <small>Receita {money(event.revenue)} · custos {money(event.costs)}</small>
                    </div>
                    <div className={event.profit >= 0 ? "positive" : "negative"}>
                      <strong>{money(event.profit)}</strong>
                      <span>{percent(event.margin)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CUSTOS</small><h2>Onde o dinheiro está indo</h2></div>
            </div>

            {topCostCategories.length === 0 ? (
              <div className="compact-empty">
                <span>💸</span>
                <b>Sem custos lançados</b>
                <p>As categorias mais relevantes aparecerão neste quadro.</p>
              </div>
            ) : (
              <div className="reports-cost-list">
                {topCostCategories.map((item) => {
                  const share = totalCosts > 0 ? (item.value / totalCosts) * 100 : 0;

                  return (
                    <div className="reports-cost-row" key={item.name}>
                      <div>
                        <b>{item.name}</b>
                        <span>{percent(share)}</span>
                      </div>
                      <strong>{money(item.value)}</strong>
                      <div className="reports-progress">
                        <span style={{ width: Math.min(100, share) + "%" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
