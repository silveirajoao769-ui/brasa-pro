import Link from "next/link";
import { redirect } from "next/navigation";
import ClientForm from "@/components/ClientForm";
import ClientDeleteButton from "@/components/ClientDeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Clientes e CRM");

  const [{ data: clients }, { data: events }, { data: payments }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, email, notes, crm_stage, source, next_follow_up_at, last_contact_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, client_id, revenue, status")
      .eq("user_id", user.id),
    supabase
      .from("event_payments")
      .select("event_id, amount, status")
      .eq("user_id", user.id),
  ]);

  const clientRows = clients || [];
  const eventRows = events || [];
  const paymentRows = payments || [];
  const clientByEvent = new Map(eventRows.map((event) => [event.id, event.client_id]));

  const metricsByClient = new Map<string, { events: number; contracted: number; paid: number }>();
  for (const event of eventRows) {
    if (!event.client_id) continue;
    const current = metricsByClient.get(event.client_id) || { events: 0, contracted: 0, paid: 0 };
    current.events += 1;
    if (["approved", "scheduled", "completed"].includes(event.status)) {
      current.contracted += Number(event.revenue || 0);
    }
    metricsByClient.set(event.client_id, current);
  }

  for (const payment of paymentRows) {
    if (payment.status !== "paid") continue;
    const clientId = clientByEvent.get(payment.event_id);
    if (!clientId) continue;
    const current = metricsByClient.get(clientId) || { events: 0, contracted: 0, paid: 0 };
    current.paid += Number(payment.amount || 0);
    metricsByClient.set(clientId, current);
  }

  const stageLabels: Record<string, string> = {
    lead: "Lead",
    contacted: "Contato feito",
    proposal: "Proposta",
    customer: "Cliente",
    inactive: "Inativo",
  };

  const now = new Date();
  const overdueFollowUps = clientRows.filter(
    (client) => client.next_follow_up_at && new Date(client.next_follow_up_at) < now,
  ).length;
  const activeCustomers = clientRows.filter((client) => client.crm_stage === "customer").length;
  const pipelineValue = clientRows.reduce(
    (sum, client) => sum + (metricsByClient.get(client.id)?.contracted || 0),
    0,
  );

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CLIENTES</small></span>
        </Link>
        <Link href="/dashboard" className="ghost-button">← Dashboard</Link>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">ÁREA PROFISSIONAL</span>
            <h1>Clientes e CRM</h1>
            <p>Acompanhe relacionamento, histórico, receita, follow-ups e evolução comercial de cada cliente.</p>
          </div>
          <span className="workspace-count">{clientRows.length} cadastrados</span>
        </div>

        <div className="crm-overview-strip">
          <article>
            <small>BASE TOTAL</small>
            <strong>{clientRows.length}</strong>
            <span>Leads e clientes</span>
          </article>
          <article>
            <small>CLIENTES ATIVOS</small>
            <strong>{activeCustomers}</strong>
            <span>Já convertidos</span>
          </article>
          <article className={overdueFollowUps > 0 ? "crm-overdue-card" : ""}>
            <small>FOLLOW-UPS ATRASADOS</small>
            <strong>{overdueFollowUps}</strong>
            <span>Precisam de contato</span>
          </article>
          <article>
            <small>VALOR CONTRATADO</small>
            <strong>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(pipelineValue)}</strong>
            <span>Eventos aprovados/agendados/concluídos</span>
          </article>
        </div>

        <div className="workspace-layout">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO CLIENTE</small><h2>Adicionar cliente</h2></div>
            </div>
            <ClientForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SUA BASE</small><h2>Clientes cadastrados</h2></div>
            </div>

            {clientRows.length === 0 ? (
              <div className="compact-empty">
                <span>👥</span>
                <b>Nenhum cliente cadastrado</b>
                <p>Adicione o primeiro cliente usando o formulário ao lado.</p>
              </div>
            ) : (
              <div className="records-list">
                {clientRows.map((client) => {
                  const metrics = metricsByClient.get(client.id) || { events: 0, contracted: 0, paid: 0 };
                  const overdue = Boolean(
                    client.next_follow_up_at && new Date(client.next_follow_up_at) < now,
                  );

                  return (
                    <div className={overdue ? "record-row crm-client-row overdue" : "record-row crm-client-row"} key={client.id}>
                      <Link href={"/clientes/" + client.id} className="record-avatar">
                        {client.name.slice(0, 2).toUpperCase()}
                      </Link>
                      <Link href={"/clientes/" + client.id} className="record-main">
                        <b>{client.name}</b>
                        <span>{client.phone || client.email || "Sem contato informado"}</span>
                        <small>
                          {stageLabels[client.crm_stage] || client.crm_stage}
                          {client.source ? " · " + client.source : ""}
                          {overdue ? " · FOLLOW-UP ATRASADO" : ""}
                        </small>
                      </Link>
                      <Link href={"/clientes/" + client.id} className="crm-client-value">
                        <small>PAGO</small>
                        <b>{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(metrics.paid)}</b>
                        <span>{metrics.events} evento(s)</span>
                      </Link>
                      <ClientDeleteButton id={client.id} />
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
