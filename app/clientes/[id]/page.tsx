import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ClientCRMSettings from "@/components/ClientCRMSettings";
import ClientActivityForm from "@/components/ClientActivityForm";
import ClientProfileEditor from "@/components/ClientProfileEditor";
import ClientDeleteButton from "@/components/ClientDeleteButton";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function dateTime(value: string | null) {
  if (!value) return "Não definido";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function shortDate(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

const stageLabels: Record<string, string> = {
  lead: "Lead",
  contacted: "Contato feito",
  proposal: "Proposta enviada",
  customer: "Cliente",
  inactive: "Inativo",
};

const activityLabels: Record<string, string> = {
  note: "Observação",
  call: "Ligação",
  whatsapp: "WhatsApp",
  email: "E-mail",
  meeting: "Reunião",
  follow_up: "Follow-up",
};

const eventStatusLabels: Record<string, string> = {
  lead: "Lead",
  quote: "Orçamento",
  approved: "Aprovado",
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Clientes e CRM");

  const [{ data: client }, { data: events }, { data: activities }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, phone, email, notes, crm_stage, source, next_follow_up_at, last_contact_at, created_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status, created_at")
      .eq("client_id", id)
      .eq("user_id", user.id)
      .order("event_date", { ascending: false, nullsFirst: false }),
    supabase
      .from("client_activities")
      .select("id, activity_type, content, occurred_at, created_at")
      .eq("client_id", id)
      .eq("user_id", user.id)
      .order("occurred_at", { ascending: false }),
  ]);

  if (!client) notFound();

  const eventRows = events || [];
  const eventIds = eventRows.map((event) => event.id);

  const [{ data: quotes }, { data: payments }] = eventIds.length
    ? await Promise.all([
        supabase
          .from("quotes")
          .select("id, event_id, status, price_total, created_at, responded_at")
          .eq("user_id", user.id)
          .in("event_id", eventIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("event_payments")
          .select("id, event_id, amount, status, paid_at, created_at")
          .eq("user_id", user.id)
          .in("event_id", eventIds),
      ])
    : [{ data: [] }, { data: [] }];

  const quoteRows = quotes || [];
  const paymentRows = payments || [];
  const completedEvents = eventRows.filter((event) => event.status === "completed");
  const contractedEvents = eventRows.filter((event) =>
    ["approved", "scheduled", "completed"].includes(event.status),
  );
  const totalContracted = contractedEvents.reduce(
    (sum, event) => sum + Number(event.revenue || 0),
    0,
  );
  const totalPaid = paymentRows
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const approvedQuotes = quoteRows.filter((quote) => quote.status === "approved");
  const rejectedQuotes = quoteRows.filter((quote) => quote.status === "rejected");
  const decidedQuotes = approvedQuotes.length + rejectedQuotes.length;
  const closeRate = decidedQuotes > 0
    ? Math.round((approvedQuotes.length / decidedQuotes) * 100)
    : 0;

  const now = new Date();
  const nextEvent = eventRows
    .filter((event) => event.event_date && new Date(event.event_date) >= now && event.status !== "cancelled")
    .sort((a, b) => String(a.event_date).localeCompare(String(b.event_date)))[0];

  const followUpOverdue = Boolean(
    client.next_follow_up_at && new Date(client.next_follow_up_at) < now,
  );

  type TimelineItem = {
    id: string;
    kind: "activity" | "event" | "quote" | "payment";
    at: string;
    title: string;
    detail: string;
    href?: string;
  };

  const timeline: TimelineItem[] = [
    ...(activities || []).map((activity) => ({
      id: "activity-" + activity.id,
      kind: "activity" as const,
      at: activity.occurred_at || activity.created_at,
      title: activityLabels[activity.activity_type] || activity.activity_type,
      detail: activity.content,
    })),
    ...eventRows.map((event) => ({
      id: "event-" + event.id,
      kind: "event" as const,
      at: event.event_date || event.created_at,
      title: event.title,
      detail: (eventStatusLabels[event.status] || event.status) + " · " + event.guests + " convidados · " + money(Number(event.revenue || 0)),
      href: "/eventos/" + event.id,
    })),
    ...quoteRows.map((quote) => ({
      id: "quote-" + quote.id,
      kind: "quote" as const,
      at: quote.responded_at || quote.created_at,
      title: "Proposta " + quote.status,
      detail: money(Number(quote.price_total || 0)),
      href: "/orcamentos/" + quote.id,
    })),
    ...paymentRows
      .filter((payment) => payment.status === "paid")
      .map((payment) => ({
        id: "payment-" + payment.id,
        kind: "payment" as const,
        at: payment.paid_at || payment.created_at,
        title: "Pagamento recebido",
        detail: money(Number(payment.amount || 0)),
        href: "/eventos/" + payment.event_id,
      })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

  const timelineIcon: Record<TimelineItem["kind"], string> = {
    activity: "•",
    event: "🔥",
    quote: "▤",
    payment: "R$",
  };

  return (
    <main className="detail-page client-crm-page">
      <div className="shell detail-topbar">
        <Link href="/clientes" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CRM DO CLIENTE</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/clientes" className="primary-button compact">← Clientes</Link>
        </div>
      </div>

      <section className="shell detail-content">
        <div className="client-crm-hero">
          <div className="client-crm-avatar">{client.name.slice(0, 2).toUpperCase()}</div>
          <div className="client-crm-identity">
            <span className="eyebrow">RELACIONAMENTO COMERCIAL</span>
            <h1>{client.name}</h1>
            <p>
              {client.phone || "Sem telefone"}
              {client.email ? " · " + client.email : ""}
            </p>
          </div>
          <div className="client-crm-stage">
            <small>ETAPA</small>
            <strong>{stageLabels[client.crm_stage] || client.crm_stage}</strong>
            <span>{client.source ? "Origem: " + client.source : "Origem não informada"}</span>
            <ClientProfileEditor
              client={{
                id: client.id,
                name: client.name,
                phone: client.phone,
                email: client.email,
                notes: client.notes,
              }}
            />
          </div>
        </div>

        <div className="client-crm-overview">
          <article className="crm-value-card">
            <small>TOTAL PAGO</small>
            <strong>{money(totalPaid)}</strong>
            <span>Recebimentos confirmados</span>
          </article>
          <article>
            <small>VALOR CONTRATADO</small>
            <strong>{money(totalContracted)}</strong>
            <span>Eventos aprovados/agendados/concluídos</span>
          </article>
          <article>
            <small>EVENTOS REALIZADOS</small>
            <strong>{completedEvents.length}</strong>
            <span>{eventRows.length} eventos no histórico</span>
          </article>
          <article>
            <small>TAXA DE FECHAMENTO</small>
            <strong>{closeRate}%</strong>
            <span>{approvedQuotes.length} aprovadas de {decidedQuotes} respondidas</span>
          </article>
        </div>

        {(client.next_follow_up_at || nextEvent) && (
          <div className="crm-next-actions">
            {client.next_follow_up_at && (
              <div className={followUpOverdue ? "crm-next-card overdue" : "crm-next-card"}>
                <span>◷</span>
                <div>
                  <small>{followUpOverdue ? "FOLLOW-UP ATRASADO" : "PRÓXIMO FOLLOW-UP"}</small>
                  <b>{dateTime(client.next_follow_up_at)}</b>
                  <p>Último contato: {dateTime(client.last_contact_at)}</p>
                </div>
              </div>
            )}
            {nextEvent && (
              <Link href={"/eventos/" + nextEvent.id} className="crm-next-card">
                <span>🔥</span>
                <div>
                  <small>PRÓXIMO EVENTO</small>
                  <b>{nextEvent.title}</b>
                  <p>{shortDate(nextEvent.event_date)} · {nextEvent.guests} convidados</p>
                </div>
              </Link>
            )}
          </div>
        )}

        <div className="client-crm-main-grid">
          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>ACOMPANHAMENTO</small><h2>CRM comercial</h2></div>
            </div>
            <ClientCRMSettings
              clientId={client.id}
              initialStage={client.crm_stage}
              initialSource={client.source}
              initialFollowUp={client.next_follow_up_at}
            />
          </article>

          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>NOVO REGISTRO</small><h2>Adicionar interação</h2></div>
            </div>
            <ClientActivityForm clientId={client.id} />
          </article>
        </div>

        <div className="client-crm-history-grid">
          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>EVENTOS E PROPOSTAS</small><h2>Histórico comercial</h2></div>
              <span className="list-count">{eventRows.length} eventos</span>
            </div>

            {eventRows.length === 0 ? (
              <div className="compact-empty">
                <span>📅</span>
                <b>Nenhum evento ainda</b>
                <p>Vincule este cliente ao criar um evento.</p>
              </div>
            ) : (
              <div className="crm-event-list">
                {eventRows.map((event) => {
                  const eventQuotes = quoteRows.filter((quote) => quote.event_id === event.id);
                  const paid = paymentRows
                    .filter((payment) => payment.event_id === event.id && payment.status === "paid")
                    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

                  return (
                    <Link href={"/eventos/" + event.id} className="crm-event-row" key={event.id}>
                      <div>
                        <small>{shortDate(event.event_date)}</small>
                        <b>{event.title}</b>
                        <span>{event.guests} convidados · {eventStatusLabels[event.status] || event.status}</span>
                      </div>
                      <div>
                        <small>ORÇAMENTOS</small>
                        <b>{eventQuotes.length}</b>
                      </div>
                      <div>
                        <small>VALOR</small>
                        <b>{money(Number(event.revenue || 0))}</b>
                      </div>
                      <div>
                        <small>RECEBIDO</small>
                        <b>{money(paid)}</b>
                      </div>
                      <span className="event-arrow">→</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </article>

          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>LINHA DO TEMPO</small><h2>Atividade do cliente</h2></div>
            </div>

            {timeline.length === 0 ? (
              <div className="compact-empty">
                <span>•</span>
                <b>Sem histórico ainda</b>
                <p>Registre contatos, eventos e propostas para formar o histórico.</p>
              </div>
            ) : (
              <div className="crm-timeline">
                {timeline.slice(0, 30).map((item) => {
                  const content = (
                    <>
                      <span className={"crm-timeline-icon " + item.kind}>{timelineIcon[item.kind]}</span>
                      <div>
                        <small>{dateTime(item.at)}</small>
                        <b>{item.title}</b>
                        <p>{item.detail}</p>
                      </div>
                    </>
                  );

                  return item.href ? (
                    <Link href={item.href} className="crm-timeline-row" key={item.id}>{content}</Link>
                  ) : (
                    <div className="crm-timeline-row" key={item.id}>{content}</div>
                  );
                })}
              </div>
            )}
          </article>
        </div>

        {client.notes && (
          <article className="detail-panel event-notes">
            <small>OBSERVAÇÕES DO CLIENTE</small>
            <p>{client.notes}</p>
          </article>
        )}

        <div className="crm-danger-zone">
          <small>GERENCIAR CADASTRO</small>
          <ClientDeleteButton id={client.id} />
        </div>
      </section>
    </main>
  );
}
