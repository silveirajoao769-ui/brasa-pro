import Link from "next/link";
import { notFound } from "next/navigation";
import PublicQuoteResponse from "@/components/PublicQuoteResponse";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
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

function eventDateLabel(value: string | null) {
  if (!value) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PublicProposalPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_quote", {
    p_token: token,
  });

  if (error || !data || data.length === 0) notFound();

  const proposal = data[0];

  return (
    <main className="public-proposal-page">
      <div className="shell public-proposal-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>PROPOSTA DIGITAL</small></span>
        </Link>
        <span className="public-proposal-badge">Proposta segura</span>
      </div>

      <section className="public-proposal-card">
        <div className="public-proposal-hero">
          <div>
            <span className="eyebrow">PROPOSTA COMERCIAL</span>
            <h1>{proposal.event_title}</h1>
            <p>
              {proposal.client_name ? proposal.client_name + " · " : ""}
              {proposal.guests} convidados · {eventDateLabel(proposal.event_date)}
            </p>
          </div>
          <div className="public-proposal-number">
            <small>ORÇAMENTO</small>
            <strong>#{String(proposal.quote_number).padStart(4, "0")}</strong>
          </div>
        </div>

        <div className="public-proposal-summary">
          <div>
            <small>VALOR TOTAL</small>
            <strong>{money(Number(proposal.price_total))}</strong>
          </div>
          <div>
            <small>VALOR POR PESSOA</small>
            <strong>
              {money(proposal.guests > 0 ? Number(proposal.price_total) / proposal.guests : 0)}
            </strong>
          </div>
          <div>
            <small>VALIDADE</small>
            <strong>{dateLabel(proposal.valid_until)}</strong>
          </div>
        </div>

        <div className="public-proposal-info">
          <div>
            <small>CLIENTE</small>
            <b>{proposal.client_name || "Cliente"}</b>
            <span>{proposal.client_phone || proposal.client_email || "Contato não informado"}</span>
          </div>
          <div>
            <small>EVENTO</small>
            <b>{proposal.event_title}</b>
            <span>{proposal.guests} convidados</span>
          </div>
        </div>

        {proposal.event_notes && (
          <div className="public-proposal-notes">
            <small>OBSERVAÇÕES</small>
            <p>{proposal.event_notes}</p>
          </div>
        )}

        <PublicQuoteResponse token={token} status={proposal.quote_status} />

        <div className="public-proposal-footer">
          <span>🔥 Brasa Pro</span>
          <p>Proposta gerada digitalmente pela plataforma Brasa Pro.</p>
        </div>
      </section>
    </main>
  );
}
