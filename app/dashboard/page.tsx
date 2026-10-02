import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActivePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value);
}

function shortDate(value: string | null) {
  if (!value) return "SEM DATA";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value)).toUpperCase().replace(".", "");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let { data: profile } = await supabase
    .from("profiles")
    .select("full_name, account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const fallbackName =
      typeof user.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : user.email?.split("@")[0] || "Churrasqueiro";

    const { data } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        full_name: fallbackName,
        account_type: "consumer",
      })
      .select("full_name, account_type")
      .single();

    profile = data;
  }

  const subscription = await getSubscription(supabase, user.id);
  const isPro = isActivePro(subscription);

  const [
    barbecueCountResult,
    clientCountResult,
    clientCRMResult,
    recentBarbecuesResult,
    eventsResult,
    paymentsResult,
  ] = await Promise.all([
    supabase
      .from("barbecues")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("clients")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("clients")
      .select("id, name, crm_stage, next_follow_up_at")
      .eq("user_id", user.id)
      .order("next_follow_up_at", { ascending: true, nullsFirst: false })
      .limit(8),
    supabase
      .from("barbecues")
      .select("id, title, event_date, adults, children, estimated_cost, budget, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status")
      .eq("user_id", user.id)
      .order("event_date", { ascending: true }),
    supabase
      .from("event_payments")
      .select("amount, status")
      .eq("user_id", user.id),
  ]);

  const events = eventsResult.data || [];
  const eventIds = events.map((event) => event.id);
  let totalCosts = 0;

  if (eventIds.length > 0) {
    const { data: costs } = await supabase
      .from("event_costs")
      .select("amount")
      .in("event_id", eventIds);

    totalCosts = (costs || []).reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  }

  const totalRevenue = events.reduce((sum, event) => sum + Number(event.revenue || 0), 0);
  const receivedTotal = (paymentsResult.data || [])
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const profit = totalRevenue - totalCosts;
  const margin = totalRevenue > 0 ? Math.round((profit / totalRevenue) * 100) : 0;
  const recentBarbecues = recentBarbecuesResult.data || [];
  const crmClients = clientCRMResult.data || [];
  const now = new Date();
  const overdueFollowUps = crmClients.filter(
    (client) => client.next_follow_up_at && new Date(client.next_follow_up_at) < now,
  );
  const nextFollowUps = crmClients.filter(
    (client) => client.next_follow_up_at && new Date(client.next_follow_up_at) >= now,
  );
  const displayName = profile?.full_name?.trim() || "Churrasqueiro";
  const accountLabel =
    profile?.account_type === "professional"
      ? "CONTA PROFISSIONAL"
      : profile?.account_type === "supplier"
        ? "FORNECEDOR"
        : "CONTA PESSOAL";

  const stats = [
    ["Churrascos salvos", String(barbecueCountResult.count || 0), "Planejamentos na sua conta"],
    [
      "Receita dos eventos",
      isPro ? money(totalRevenue) : "PRO",
      isPro ? events.length + " eventos cadastrados" : "Disponível no plano Pro",
    ],
    [
      "Lucro dos eventos",
      isPro ? money(profit) : "PRO",
      isPro ? margin + "% de margem" : "Financeiro profissional",
    ],
    [
      "Clientes",
      isPro ? String(clientCountResult.count || 0) : "PRO",
      isPro ? "Base de clientes" : "CRM e histórico de clientes",
    ],
  ];

  return (
    <main className="app-page">
      <aside className="app-sidebar">
        <Link href="/" className="app-logo">🔥 <b>Brasa <i>Pro</i></b></Link>
        <nav>
          <Link className="active" href="/dashboard">⌂ <span>Dashboard</span></Link>
          <Link href="/planejar">✦ <span>Planejamento</span></Link>
          <Link href="/planejar">▦ <span>Calculadora</span></Link>
          <Link href="/receitas">☷ <span>Receitas</span></Link>
          <Link href="/compras">🛒 <span>Compras</span></Link>
          <Link href="/pedidos">🧾 <span>Pedidos</span></Link>
          <Link href="/clientes">♙ <span>Clientes</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/eventos">□ <span>Eventos</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/agenda">◷ <span>Agenda</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/equipe">👥 <span>Equipe</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/pacotes">🍖 <span>Pacotes</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/financeiro">↗ <span>Financeiro</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/relatorios">▥ <span>Relatórios</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/estoque">📦 <span>Estoque</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/fornecedores">🚚 <span>Fornecedores</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/fornecedor">🏪 <span>Portal fornecedor</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/configuracoes">⚙ <span>Configurações</span>{!isPro && <small className="nav-pro-tag">PRO</small>}</Link>
          <Link href="/plano">💳 <span>Plano</span></Link>
        </nav>
        <div className="sidebar-footer">
          <small>{accountLabel} · {isPro ? "PLANO PRO" : "PLANO FREE"}</small>
          <b>{user.email}</b>
          <LogoutButton />
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">VISÃO GERAL</span>
            <h1>Olá, {displayName}. 🔥</h1>
            <p>Seus números abaixo agora vêm da sua conta no Brasa Pro.</p>
          </div>
          <div className="app-header-actions">
            <Link href="/planejar" className="primary-button compact">+ Novo churrasco</Link>
            <div className="avatar">{displayName.slice(0, 2).toUpperCase()}</div>
          </div>
        </header>

        <div className="app-stats">
          {stats.map(([label,value,detail]) => (
            <article key={label}>
              <small>{label}</small>
              <strong>{value}</strong>
              <span>{detail}</span>
            </article>
          ))}
        </div>

        <div className="dashboard-grid">
          <article className="dashboard-panel panel-wide">
            <div className="panel-heading">
              <div>
                <small>PLANEJAMENTOS REAIS</small>
                <h2>Meus churrascos</h2>
              </div>
              <Link href="/planejar" className="ghost-button">+ Criar</Link>
            </div>

            {recentBarbecues.length === 0 ? (
              <div className="dashboard-empty">
                <span>🔥</span>
                <h3>Seu primeiro churrasco começa aqui.</h3>
                <p>Crie um planejamento e ele aparecerá automaticamente neste dashboard.</p>
                <Link href="/planejar" className="primary-button">Planejar agora →</Link>
              </div>
            ) : (
              <div className="event-list">
                {recentBarbecues.map((barbecue) => {
                  const guests = Number(barbecue.adults || 0) + Number(barbecue.children || 0);
                  return (
                    <Link className="event-row barbecue-row-link" href={"/churrascos/" + barbecue.id} key={barbecue.id}>
                      <b className="event-date">{shortDate(barbecue.event_date)}</b>
                      <div>
                        <strong>{barbecue.title}</strong>
                        <span>{guests} pessoas · estimado em {money(Number(barbecue.estimated_cost || 0))}</span>
                      </div>
                      <span className="status-pill confirmado">Salvo</span>
                      <span className="event-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          <article className="dashboard-panel">
            <div className="panel-heading">
              <div><small>RESULTADO REAL</small><h2>Financeiro</h2></div>
            </div>
            <div className="finance-ring" style={{
              background: "radial-gradient(circle, #11161b 54%, transparent 56%), conic-gradient(var(--green) " + Math.max(0, Math.min(100, margin)) + "%, #26302b 0)"
            }}>
              <span><b>{margin}%</b><small>margem</small></span>
            </div>
            <div className="finance-mini">
              <div><span>Receita</span><b>{money(totalRevenue)}</b></div>
              <div><span>Recebido</span><b className="positive">{money(receivedTotal)}</b></div>
              <div><span>Custos</span><b>{money(totalCosts)}</b></div>
              <div><span>Lucro</span><b className={profit >= 0 ? "positive" : ""}>{money(profit)}</b></div>
            </div>
            {events.length === 0 && (
              <p className="panel-note">Nenhum evento profissional cadastrado ainda.</p>
            )}
          </article>

          <article className="dashboard-panel">
            <div className="panel-heading">
              <div><small>CRM COMERCIAL</small><h2>Follow-ups</h2></div>
              {isPro && <Link href="/clientes" className="ghost-button">Abrir CRM</Link>}
            </div>

            {!isPro ? (
              <div className="compact-empty">
                <span>♙</span>
                <b>CRM disponível no Pro</b>
                <p>Acompanhe clientes, histórico, propostas e próximos contatos.</p>
                <Link href="/plano?feature=Clientes%20e%20CRM" className="primary-button">Conhecer Pro →</Link>
              </div>
            ) : overdueFollowUps.length === 0 && nextFollowUps.length === 0 ? (
              <div className="compact-empty">
                <span>✓</span>
                <b>Nenhum follow-up pendente</b>
                <p>Abra um cliente para programar o próximo contato.</p>
              </div>
            ) : (
              <div className="crm-dashboard-list">
                {overdueFollowUps.slice(0, 2).map((client) => (
                  <Link href={"/clientes/" + client.id} key={client.id} className="crm-dashboard-row overdue">
                    <span>!</span>
                    <div>
                      <small>ATRASADO</small>
                      <b>{client.name}</b>
                      <p>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(client.next_follow_up_at!))}</p>
                    </div>
                    <em>→</em>
                  </Link>
                ))}
                {nextFollowUps.slice(0, 3).map((client) => (
                  <Link href={"/clientes/" + client.id} key={client.id} className="crm-dashboard-row">
                    <span>◷</span>
                    <div>
                      <small>PRÓXIMO CONTATO</small>
                      <b>{client.name}</b>
                      <p>{new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(client.next_follow_up_at!))}</p>
                    </div>
                    <em>→</em>
                  </Link>
                ))}
              </div>
            )}
          </article>

          <article className="dashboard-panel ai-dashboard-panel">
            <span className="eyebrow">PLANEJAMENTO RÁPIDO</span>
            <h2>Planeje o próximo churrasco</h2>
            <p>O planejador já salva convidados, orçamento, quantidades e lista de compras na sua conta.</p>
            <Link href="/planejar" className="primary-button">Começar planejamento →</Link>
          </article>

          <article className="dashboard-panel">
            <div className="panel-heading">
              <div><small>AGENDA PROFISSIONAL</small><h2>Próximos eventos</h2></div>
              {isPro && <Link href="/agenda" className="ghost-button">Abrir agenda</Link>}
            </div>

            {events.length === 0 ? (
              <div className="compact-empty">
                <span>📅</span>
                <b>Sem eventos ainda</b>
                <p>Crie um evento profissional para acompanhar prazos, custos e tarefas na agenda.</p>
              </div>
            ) : (
              <div className="client-list">
                {events.slice(0, 3).map((event) => (
                  <div key={event.id}>
                    <span>{shortDate(event.event_date).slice(0, 2)}</span>
                    <p>
                      <b>{event.title}</b>
                      <small>{event.guests} convidados · {event.status}</small>
                    </p>
                    <em>{money(Number(event.revenue || 0))}</em>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
