import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import EventCostForm from "@/components/EventCostForm";
import QuoteForm from "@/components/QuoteForm";
import { createClient } from "@/lib/supabase/server";

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

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: costs }, clientResult, quoteResult] = await Promise.all([
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
  ]);

  const client = clientResult.data;
  const quote = quoteResult.data;
  const totalCosts = (costs || []).reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  const revenue = Number(event.revenue || 0);
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const costPerGuest = event.guests > 0 ? totalCosts / event.guests : 0;
  const pricePerGuest = event.guests > 0 ? revenue / event.guests : 0;

  return (
    <main className="detail-page">
      <div className="shell detail-topbar">
        <Link href="/eventos" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>EVENTO PROFISSIONAL</small></span>
        </Link>
        <div className="detail-actions">
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
