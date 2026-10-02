import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EventCostForm from "@/components/EventCostForm";
import EventTaskToggle from "@/components/EventTaskToggle";
import EventPaymentForm from "@/components/EventPaymentForm";
import EventPaymentActions from "@/components/EventPaymentActions";
import QuoteForm from "@/components/QuoteForm";
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

function dateLabel(value: string | null) {
  if (!value) return "Data não definida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

const statusLabels: Record<string, string> = {
  lead: "Lead",
  quote: "Orçamento",
  approved: "Aprovado",
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Eventos profissionais");

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: costs }, clientResult, quoteResult, { data: tasks }, { data: payments }] = await Promise.all([
    supabase
      .from("event_costs")
      .select("id, category, description, amount, created_at")
      .eq("event_id", id)
      .order("created_at", { ascending: false }),
    event.client_id
      ? supabase
          .from("clients")
          .select("id, name, phone, email")
          .eq("id", event.client_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("quotes")
      .select("id, margin_percent, valid_until, price_total, status")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("event_tasks")
      .select("id, title, due_at, completed, notes")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false }),
    supabase
      .from("event_payments")
      .select("id, kind, description, amount, due_date, status, paid_at, payment_method, notes, created_at")
      .eq("event_id", id)
      .eq("user_id", user.id)
      .order("due_date", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true }),
  ]);

  const client = clientResult.data;
  const quote = quoteResult.data;
  const totalCosts = (costs || []).reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  const revenue = Number(event.revenue || 0);
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const costPerGuest = event.guests > 0 ? totalCosts / event.guests : 0;
  const pricePerGuest = event.guests > 0 ? revenue / event.guests : 0;
  const paymentRows = payments || [];
  const activePayments = paymentRows.filter((payment) => payment.status !== "cancelled");
  const receivedAmount = activePayments
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const scheduledAmount = activePayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0,
  );
  const pendingAmount = activePayments
    .filter((payment) => payment.status === "pending")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const remainingToSchedule = Math.max(0, revenue - scheduledAmount);
  const remainingToReceive = Math.max(0, revenue - receivedAmount);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overduePayments = activePayments.filter(
    (payment) =>
      payment.status === "pending" &&
      payment.due_date &&
      new Date(payment.due_date + "T12:00:00") < today,
  );

  const paymentKindLabels: Record<string, string> = {
    signal: "Sinal",
    installment: "Parcela",
    balance: "Saldo final",
    other: "Outro",
  };

  return (
    <main className="detail-page">
      <div className="shell detail-topbar">
        <Link href="/eventos" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>EVENTO PROFISSIONAL</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/agenda" className="ghost-button">Agenda</Link>
          <Link href="/clientes" className="ghost-button">Clientes</Link>
          <Link href="/eventos" className="primary-button compact">← Eventos</Link>
        </div>
      </div>

      <section className="shell detail-content">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">GESTÃO DO EVENTO</span>
            <h1>{event.title}</h1>
            <p>
              {dateLabel(event.event_date)} · {event.guests} convidados
              {client ? " · " + client.name : ""}
            </p>
          </div>
          <span className="detail-status">{statusLabels[event.status] || event.status}</span>
        </div>

        <div className="event-finance-hero">
          <div>
            <small>RECEITA</small>
            <strong>{money(revenue)}</strong>
          </div>
          <div>
            <small>CUSTOS</small>
            <strong>{money(totalCosts)}</strong>
          </div>
          <div className={profit >= 0 ? "profit-box" : "loss-box"}>
            <small>LUCRO</small>
            <strong>{money(profit)}</strong>
          </div>
          <div>
            <small>MARGEM</small>
            <strong>{margin.toFixed(1)}%</strong>
          </div>
        </div>

        <article className="detail-panel event-receivables-panel">
          <div className="panel-heading">
            <div>
              <small>COBRANÇAS E RECEBIMENTOS</small>
              <h2>Quanto já entrou?</h2>
            </div>
            <Link href="/financeiro" className="ghost-button">Ver financeiro</Link>
          </div>

          <div className="receivable-summary-grid">
            <div>
              <small>VALOR DO EVENTO</small>
              <strong>{money(revenue)}</strong>
              <span>Receita contratada</span>
            </div>
            <div className="receivable-success">
              <small>RECEBIDO</small>
              <strong>{money(receivedAmount)}</strong>
              <span>{revenue > 0 ? ((receivedAmount / revenue) * 100).toFixed(0) : "0"}% do evento</span>
            </div>
            <div>
              <small>A RECEBER</small>
              <strong>{money(remainingToReceive)}</strong>
              <span>{pendingAmount > 0 ? money(pendingAmount) + " já programados" : "Sem cobranças pendentes"}</span>
            </div>
            <div className={overduePayments.length > 0 ? "receivable-danger" : ""}>
              <small>VENCIDOS</small>
              <strong>{overduePayments.length}</strong>
              <span>{overduePayments.length > 0 ? "Cobranças atrasadas" : "Tudo em dia"}</span>
            </div>
          </div>

          <div className="receivable-layout">
            <div>
              <div className="panel-heading compact-heading">
                <div><small>CRONOGRAMA</small><h3>Cobranças do evento</h3></div>
                <span className="list-count">{activePayments.length} ativas</span>
              </div>

              {paymentRows.length === 0 ? (
                <div className="compact-empty">
                  <span>💰</span>
                  <b>Nenhuma cobrança cadastrada</b>
                  <p>Crie um sinal, parcelas ou saldo final para acompanhar o que já recebeu.</p>
                </div>
              ) : (
                <div className="receivable-list">
                  {paymentRows.map((payment) => {
                    const isOverdue =
                      payment.status === "pending" &&
                      payment.due_date &&
                      new Date(payment.due_date + "T12:00:00") < today;

                    return (
                      <div
                        className={
                          payment.status === "cancelled"
                            ? "receivable-row cancelled"
                            : isOverdue
                              ? "receivable-row overdue"
                              : payment.status === "paid"
                                ? "receivable-row paid"
                                : "receivable-row"
                        }
                        key={payment.id}
                      >
                        <div className="receivable-type">
                          <span>{paymentKindLabels[payment.kind] || payment.kind}</span>
                          <b>{payment.description || paymentKindLabels[payment.kind] || "Cobrança"}</b>
                          <small>
                            {payment.due_date
                              ? "Vence em " + new Intl.DateTimeFormat("pt-BR").format(new Date(payment.due_date + "T12:00:00"))
                              : "Sem vencimento"}
                          </small>
                        </div>
                        <div className="receivable-value">
                          <strong>{money(Number(payment.amount))}</strong>
                          <small>
                            {payment.status === "paid"
                              ? "Recebido"
                              : payment.status === "cancelled"
                                ? "Cancelado"
                                : isOverdue
                                  ? "Vencido"
                                  : "Pendente"}
                          </small>
                        </div>
                        <EventPaymentActions
                          paymentId={payment.id}
                          status={payment.status}
                          paymentMethod={payment.payment_method}
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="receivable-form-panel">
              <div className="panel-heading compact-heading">
                <div><small>NOVA COBRANÇA</small><h3>Programar recebimento</h3></div>
              </div>
              <EventPaymentForm eventId={event.id} remaining={remainingToSchedule} />
            </div>
          </div>
        </article>

        <div className="detail-grid">
          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>CUSTOS DO EVENTO</small><h2>Despesas</h2></div>
              <span className="list-count">{costs?.length || 0} lançamentos</span>
            </div>

            {!costs || costs.length === 0 ? (
              <div className="compact-empty">
                <span>💸</span>
                <b>Nenhum custo lançado</b>
                <p>Comece pelas carnes, equipe, transporte e demais despesas.</p>
              </div>
            ) : (
              <div className="cost-list">
                {costs.map((cost) => (
                  <div className="cost-row" key={cost.id}>
                    <span>{cost.category}</span>
                    <div>
                      <b>{cost.description}</b>
                      <small>Lançado no evento</small>
                    </div>
                    <strong>{money(Number(cost.amount))}</strong>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="detail-panel">
            <div className="panel-heading">
              <div><small>NOVO LANÇAMENTO</small><h2>Adicionar custo</h2></div>
            </div>
            <EventCostForm eventId={event.id} />
          </article>
        </div>

        <article className="detail-panel event-task-panel">
          <div className="panel-heading">
            <div>
              <small>CHECKLIST DO EVENTO</small>
              <h2>Pendências</h2>
            </div>
            <Link href="/agenda" className="ghost-button">Gerenciar na agenda</Link>
          </div>

          {!tasks || tasks.length === 0 ? (
            <div className="compact-empty">
              <span>☑</span>
              <b>Sem tarefas vinculadas</b>
              <p>Adicione prazos, confirmações e pendências na Agenda profissional.</p>
            </div>
          ) : (
            <div className="agenda-task-list event-detail-task-list">
              {tasks.slice(0, 8).map((task) => (
                <div className={task.completed ? "agenda-task-row completed-event-task" : "agenda-task-row"} key={task.id}>
                  <EventTaskToggle taskId={task.id} completed={task.completed} />
                  <div className="agenda-task-main">
                    <b>{task.title}</b>
                    <span>
                      {task.due_at
                        ? new Intl.DateTimeFormat("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          }).format(new Date(task.due_at))
                        : "Sem prazo definido"}
                    </span>
                    {task.notes && <small>{task.notes}</small>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="detail-panel quote-workspace">
          <div className="panel-heading">
            <div>
              <small>ORÇAMENTO PROFISSIONAL</small>
              <h2>Quanto cobrar?</h2>
            </div>
            {quote && (
              <Link className="ghost-button" href={"/orcamentos/" + quote.id}>
                Ver orçamento
              </Link>
            )}
          </div>

          <p className="quote-intro">
            O Brasa Pro usa os custos lançados e sua margem desejada para sugerir o preço de venda.
          </p>

          <QuoteForm
            eventId={event.id}
            quoteId={quote?.id || null}
            totalCosts={totalCosts}
            currentRevenue={revenue}
            initialMargin={quote ? Number(quote.margin_percent) : 35}
            initialValidUntil={quote?.valid_until || null}
          />
        </article>

        <div className="event-summary-grid">
          <article className="detail-panel">
            <small>CUSTO POR PESSOA</small>
            <strong>{money(costPerGuest)}</strong>
            <p>Quanto o evento está custando por convidado.</p>
          </article>
          <article className="detail-panel">
            <small>PREÇO POR PESSOA</small>
            <strong>{money(pricePerGuest)}</strong>
            <p>Valor de venda médio por convidado.</p>
          </article>
          <article className="detail-panel">
            <small>CLIENTE</small>
            <strong>{client?.name || "Não vinculado"}</strong>
            <p>{client?.phone || client?.email || "Adicione um cliente ao evento depois."}</p>
          </article>
        </div>

        {event.notes && (
          <article className="detail-panel event-notes">
            <small>OBSERVAÇÕES</small>
            <p>{event.notes}</p>
          </article>
        )}
      </section>
    </main>
  );
}
