import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const stats = [
  ["Eventos no mês", "6", "+2 vs mês anterior"],
  ["Receita prevista", "R$ 18.450", "3 eventos confirmados"],
  ["Lucro estimado", "R$ 7.820", "42,4% de margem"],
  ["Clientes ativos", "14", "5 novos no mês"],
];

const events = [
  ["05 OUT", "Churrasco aniversário", "35 pessoas", "Planejado"],
  ["12 OUT", "Evento corporativo", "80 pessoas", "Confirmado"],
  ["26 OUT", "Casamento", "120 pessoas", "Orçamento"],
];

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

  const displayName = profile?.full_name?.trim() || "Churrasqueiro";

  return (
    <main className="app-page">
      <aside className="app-sidebar">
        <Link href="/" className="app-logo">🔥 <b>Brasa <i>Pro</i></b></Link>
        <nav>
          <Link className="active" href="/dashboard">⌂ <span>Dashboard</span></Link>
          <Link href="/planejar">✦ <span>Planejamento</span></Link>
          <Link href="/planejar">▦ <span>Calculadora</span></Link>
          <a href="#">☷ <span>Receitas</span></a>
          <a href="#">🛒 <span>Compras</span></a>
          <a href="#">♙ <span>Clientes</span></a>
          <a href="#">□ <span>Eventos</span></a>
          <a href="#">↗ <span>Financeiro</span></a>
        </nav>
        <div className="sidebar-footer">
          <small>{profile?.account_type === "professional" ? "CONTA PROFISSIONAL" : "BRASA PRO"}</small>
          <b>{user.email}</b>
          <LogoutButton />
        </div>
      </aside>

      <section className="app-content">
        <header className="app-header">
          <div>
            <span className="eyebrow">VISÃO GERAL</span>
            <h1>Olá, {displayName}. 🔥</h1>
            <p>Acompanhe eventos, custos e lucro em um só lugar.</p>
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
                <small>PRÓXIMOS EVENTOS</small>
                <h2>Agenda</h2>
              </div>
              <button className="ghost-button">Ver todos</button>
            </div>
            <div className="event-list">
              {events.map(([date,name,people,status]) => (
                <div className="event-row" key={name}>
                  <b className="event-date">{date}</b>
                  <div><strong>{name}</strong><span>{people}</span></div>
                  <span className={"status-pill " + status.toLowerCase()}>{status}</span>
                  <button>→</button>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-panel">
            <div className="panel-heading">
              <div><small>RESULTADO DO MÊS</small><h2>Financeiro</h2></div>
            </div>
            <div className="finance-ring"><span><b>42%</b><small>margem</small></span></div>
            <div className="finance-mini">
              <div><span>Receita</span><b>R$ 18.450</b></div>
              <div><span>Custos</span><b>R$ 10.630</b></div>
              <div><span>Lucro</span><b className="positive">R$ 7.820</b></div>
            </div>
          </article>

          <article className="dashboard-panel ai-dashboard-panel">
            <span className="eyebrow">✦ IA BRASA</span>
            <h2>Planeje o próximo evento</h2>
            <p>Informe convidados, orçamento e estilo. O Brasa Pro prepara as quantidades e o custo inicial.</p>
            <Link href="/planejar" className="primary-button">Começar planejamento →</Link>
          </article>

          <article className="dashboard-panel">
            <div className="panel-heading">
              <div><small>CLIENTES</small><h2>Recentes</h2></div>
            </div>
            <div className="client-list">
              <div><span>MF</span><p><b>Marcos Ferreira</b><small>2 eventos</small></p><em>R$ 5.800</em></div>
              <div><span>AS</span><p><b>Ana Souza</b><small>1 evento</small></p><em>R$ 2.900</em></div>
              <div><span>RC</span><p><b>Rafael Costa</b><small>3 eventos</small></p><em>R$ 8.400</em></div>
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
