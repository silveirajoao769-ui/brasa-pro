import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ShareQuoteActions from "@/components/ShareQuoteActions";
import ShareContractActions from "@/components/ShareContractActions";
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
  if (!value) return "Sem validade definida";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value + "T12:00:00"));
}

export default async function QuotePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Orçamentos profissionais");

  const { data: quote } = await supabase
    .from("quotes")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!quote) notFound();

  const { data: event } = await supabase
    .from("events")
    .select("id, title, event_date, guests, client_id, notes")
    .eq("id", quote.event_id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!event) notFound();

  const [{ data: client }, { data: costs }, { data: contract }] = await Promise.all([
    event.client_id
      ? supabase
          .from("clients")
          .select("name, phone, email")
          .eq("id", event.client_id)
          .eq("user_id", user.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("event_costs")
      .select("category, description, amount")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true }),
    supabase
      .from("contracts")
      .select("id, public_token, status, accepted_name, accepted_at")
      .eq("quote_id", quote.id)
      .maybeSingle(),
  ]);

  const price = Number(quote.price_total || 0);
  const totalCost = Number(quote.total_cost || 0);
  const profit = price - totalCost;
  const perGuest = event.guests > 0 ? price / event.guests : 0;
  const packageSnapshot = quote.service_package_snapshot as
    | {
        name?: string;
        description?: string;
        price_per_person?: number | string;
        charged_guests?: number;
        min_guests?: number;
        items?: Array<{
          category?: string;
          name?: string;
          quantity?: number | null;
          unit?: string;
          notes?: string;
        }>;
      }
    | null;

  return (
    <main className="quote-page">
      <div className="shell quote-topbar">
        <Link href={"/eventos/" + event.id} className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>ORÇAMENTO PROFISSIONAL</small></span>
        </Link>
        <div className="detail-actions">
          <Link href={"/eventos/" + event.id} className="ghost-button">← Voltar ao evento</Link>
        </div>
      </div>

      <div className="shell quote-owner-actions">
        <div>
          <span className="eyebrow">ENVIO AO CLIENTE</span>
          <h2>Compartilhe a proposta e receba a aprovação online.</h2>
          <p>Status atual: <b>{quote.status}</b></p>
        </div>
        <ShareQuoteActions
          quoteId={quote.id}
          publicToken={quote.public_token}
          status={quote.status}
        />
      </div>

      {contract && (
        <div className="shell quote-owner-actions contract-owner-actions">
          <div>
            <span className="eyebrow">CONTRATO DIGITAL</span>
            <h2>O contrato foi gerado a partir da proposta aprovada.</h2>
            <p>
              Status: <b>{contract.status === "accepted" ? "aceito pelo cliente" : "aguardando aceite"}</b>
            </p>
          </div>
          <ShareContractActions
            publicToken={contract.public_token}
            status={contract.status}
          />
        </div>
      )}

      <section className="quote-document">
        <div className="quote-document-header">
          <div>
            <span className="eyebrow">PROPOSTA COMERCIAL</span>
            <h1>{event.title}</h1>
            <p>
              {event.guests} convidados
              {client?.name ? " · " + client.name : ""}
            </p>
          </div>
          <div className="quote-number">
            <small>ORÇAMENTO</small>
            <strong>#{String(quote.quote_number).padStart(4, "0")}</strong>
          </div>
        </div>

        <div className="quote-summary">
          <div>
            <small>VALOR TOTAL</small>
            <strong>{money(price)}</strong>
          </div>
          <div>
            <small>VALOR POR PESSOA</small>
            <strong>{money(perGuest)}</strong>
          </div>
          <div>
            <small>VALIDADE</small>
            <strong>{dateLabel(quote.valid_until)}</strong>
          </div>
        </div>

        <div className="quote-section">
          <div className="quote-section-heading">
            <span>01</span>
            <div><small>EVENTO</small><h2>Informações principais</h2></div>
          </div>

          <div className="quote-info-grid">
            <div><small>Evento</small><b>{event.title}</b></div>
            <div><small>Convidados</small><b>{event.guests}</b></div>
            <div><small>Cliente</small><b>{client?.name || "Não informado"}</b></div>
            <div><small>Contato</small><b>{client?.phone || client?.email || "Não informado"}</b></div>
          </div>
        </div>

        {packageSnapshot && (
          <div className="quote-section quote-package-section">
            <div className="quote-section-heading">
              <span>02</span>
              <div><small>PACOTE CONTRATADO</small><h2>{packageSnapshot.name || "Pacote profissional"}</h2></div>
            </div>

            <div className="quote-package-summary">
              <div>
                <small>VALOR POR PESSOA</small>
                <b>{money(Number(packageSnapshot.price_per_person || 0))}</b>
              </div>
              <div>
                <small>PESSOAS COBRADAS</small>
                <b>{packageSnapshot.charged_guests || event.guests}</b>
              </div>
              <div>
                <small>MÍNIMO DO PACOTE</small>
                <b>{packageSnapshot.min_guests || 1}</b>
              </div>
            </div>

            {packageSnapshot.description && <p className="quote-muted">{packageSnapshot.description}</p>}

            {packageSnapshot.items && packageSnapshot.items.length > 0 && (
              <div className="quote-package-items">
                {packageSnapshot.items.map((item, index) => (
                  <div key={index}>
                    <span>{item.category || "Incluído"}</span>
                    <b>{item.name || "Item"}</b>
                    <small>
                      {item.quantity != null
                        ? Number(item.quantity).toLocaleString("pt-BR") + " " + (item.unit || "un")
                        : item.notes || "Incluído"}
                    </small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="quote-section">
          <div className="quote-section-heading">
            <span>{packageSnapshot ? "03" : "02"}</span>
            <div><small>COMPOSIÇÃO</small><h2>Custos considerados</h2></div>
          </div>

          {!costs || costs.length === 0 ? (
            <p className="quote-muted">Nenhum custo detalhado foi lançado neste evento.</p>
          ) : (
            <div className="quote-cost-table">
              {costs.map((cost, index) => (
                <div key={index}>
                  <span>{cost.category}</span>
                  <b>{cost.description}</b>
                  <strong>{money(Number(cost.amount))}</strong>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="quote-section quote-final-section">
          <div>
            <small>MARGEM DEFINIDA</small>
            <strong>{Number(quote.margin_percent).toFixed(1)}%</strong>
          </div>
          <div>
            <small>LUCRO PROJETADO</small>
            <strong>{money(profit)}</strong>
          </div>
          <div className="quote-total-box">
            <small>INVESTIMENTO TOTAL</small>
            <strong>{money(price)}</strong>
          </div>
        </div>

        {event.notes && (
          <div className="quote-notes">
            <small>OBSERVAÇÕES DO EVENTO</small>
            <p>{event.notes}</p>
          </div>
        )}

        <div className="quote-footer">
          <span>🔥 Brasa Pro</span>
          <p>Orçamento gerado pela plataforma Brasa Pro.</p>
        </div>
      </section>
    </main>
  );
}
