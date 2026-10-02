import Link from "next/link";
import { notFound } from "next/navigation";
import PublicContractAcceptance from "@/components/PublicContractAcceptance";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ token: string }>;
};

type ContractSnapshot = {
  quote_number?: number | string | null;
  price_total?: number | string | null;
  event_title?: string | null;
  event_date?: string | null;
  guests?: number | null;
  event_notes?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  provider_name?: string | null;
  provider_business_name?: string | null;
  provider_phone?: string | null;
  provider_email?: string | null;
  provider_instagram?: string | null;
  provider_logo_url?: string | null;
  provider_tax_id?: string | null;
  provider_address?: string | null;
  provider_zip_code?: string | null;
  provider_city?: string | null;
  provider_state?: string | null;
  service_package?: {
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
  } | null;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function dateLabel(value: string | null | undefined) {
  if (!value) return "Data a definir";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

export default async function PublicContractPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_public_contract", {
    p_token: token,
  });

  if (error || !data || data.length === 0) notFound();

  const contract = data[0];
  const snapshot = (contract.snapshot || {}) as ContractSnapshot;
  const providerLocation = [snapshot.provider_city, snapshot.provider_state]
    .filter(Boolean)
    .join(" / ");

  return (
    <main className="public-proposal-page">
      <div className="shell public-proposal-topbar">
        <Link href="/" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CONTRATO DIGITAL</small></span>
        </Link>
        <span className="public-proposal-badge">
          {contract.contract_status === "accepted" ? "Aceito" : "Aguardando aceite"}
        </span>
      </div>

      <section className="public-proposal-card contract-document">
        <div className="public-proposal-hero">
          <div>
            <span className="eyebrow">CONTRATO DE PRESTAÇÃO DE SERVIÇO</span>
            <h1>{snapshot.event_title || "Evento de churrasco"}</h1>
            <p>
              {snapshot.client_name || "Cliente"} · {snapshot.guests || 0} convidados · {dateLabel(snapshot.event_date)}
            </p>
          </div>
          <div className="public-proposal-number">
            <small>ORÇAMENTO</small>
            <strong>#{String(snapshot.quote_number || "").padStart(4, "0")}</strong>
          </div>
        </div>

        <div className="public-proposal-summary">
          <div>
            <small>CONTRATANTE</small>
            <strong>{snapshot.client_name || "Cliente"}</strong>
          </div>
          <div>
            <small>CONTRATADO</small>
            <strong>{snapshot.provider_business_name || snapshot.provider_name || "Profissional Brasa Pro"}</strong>
          </div>
          <div>
            <small>VALOR APROVADO</small>
            <strong>{money(Number(snapshot.price_total || 0))}</strong>
          </div>
        </div>

        <div className="public-provider-card contract-provider-card">
          <div className="public-provider-logo">
            {snapshot.provider_logo_url ? (
              <img src={snapshot.provider_logo_url} alt={snapshot.provider_business_name || snapshot.provider_name || "Logo"} />
            ) : (
              <span>🔥</span>
            )}
          </div>
          <div className="public-provider-main">
            <small>PRESTADOR</small>
            <b>{snapshot.provider_business_name || snapshot.provider_name || "Profissional Brasa Pro"}</b>
            <span>
              {[snapshot.provider_phone, snapshot.provider_email, snapshot.provider_instagram]
                .filter(Boolean)
                .join(" · ") || "Contato não informado"}
            </span>
          </div>
          <div className="public-provider-location">
            <small>IDENTIFICAÇÃO</small>
            <b>{snapshot.provider_tax_id || providerLocation || "Dados não informados"}</b>
            {snapshot.provider_address && <span>{snapshot.provider_address}</span>}
          </div>
        </div>

        {snapshot.service_package && (
          <div className="public-package-block contract-package-block">
            <div className="public-package-heading">
              <div>
                <small>PACOTE CONTRATADO</small>
                <h2>{snapshot.service_package.name || "Pacote profissional"}</h2>
                <p>{snapshot.service_package.description || "Escopo comercial aprovado pelo cliente."}</p>
              </div>
              <div>
                <small>POR PESSOA</small>
                <strong>{money(Number(snapshot.service_package.price_per_person || 0))}</strong>
              </div>
            </div>

            {snapshot.service_package.items && snapshot.service_package.items.length > 0 && (
              <div className="public-package-items">
                {snapshot.service_package.items.map((item, index) => (
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

        <div className="contract-terms">
          <article>
            <span>01</span>
            <div>
              <h2>Objeto</h2>
              <p>
                Prestação de serviço de churrasco para o evento <b>{snapshot.event_title || "informado"}</b>,
                previsto para {dateLabel(snapshot.event_date)}, com referência de {snapshot.guests || 0} convidados.
              </p>
            </div>
          </article>

          <article>
            <span>02</span>
            <div>
              <h2>Valor contratado</h2>
              <p>
                O valor total aprovado para o serviço é de <b>{money(Number(snapshot.price_total || 0))}</b>,
                conforme a proposta comercial vinculada a este contrato.
              </p>
            </div>
          </article>

          <article>
            <span>03</span>
            <div>
              <h2>Escopo e ajustes</h2>
              <p>
                {snapshot.service_package
                  ? "O escopo inclui o pacote " + (snapshot.service_package.name || "selecionado") +
                    " e os itens exibidos neste contrato. Alterações de quantidade de convidados, data, horário, cardápio, estrutura ou outros itens devem ser combinadas entre as partes e podem exigir atualização do valor originalmente aprovado."
                  : "Alterações de quantidade de convidados, data, horário, cardápio, estrutura ou outros itens devem ser combinadas entre as partes e podem exigir atualização do valor originalmente aprovado."}
              </p>
            </div>
          </article>

          <article>
            <span>04</span>
            <div>
              <h2>Pagamento e remarcação</h2>
              <p>
                Forma de pagamento, datas de cobrança e condições de remarcação seguem o que for combinado
                entre contratante e contratado. Este documento não cria multa ou taxa adicional que não tenha
                sido previamente apresentada ao cliente.
              </p>
            </div>
          </article>

          <article>
            <span>05</span>
            <div>
              <h2>Aceite eletrônico</h2>
              <p>
                O aceite abaixo registra a concordância eletrônica com os termos apresentados e mantém
                data, nome do aceitante e a versão deste contrato. Ele não é apresentado como assinatura digital
                qualificada quando a legislação exigir forma específica.
              </p>
            </div>
          </article>
        </div>

        {snapshot.event_notes && (
          <div className="public-proposal-notes">
            <small>OBSERVAÇÕES DO EVENTO</small>
            <p>{snapshot.event_notes}</p>
          </div>
        )}

        <div className="public-proposal-info">
          <div>
            <small>CONTRATANTE</small>
            <b>{snapshot.client_name || "Cliente"}</b>
            <span>{snapshot.client_phone || snapshot.client_email || "Contato não informado"}</span>
          </div>
          <div>
            <small>CONTRATADO</small>
            <b>{snapshot.provider_business_name || snapshot.provider_name || "Profissional Brasa Pro"}</b>
            <span>{snapshot.provider_phone || snapshot.provider_email || providerLocation || "Contato não informado"}</span>
          </div>
        </div>

        <PublicContractAcceptance
          token={token}
          status={contract.contract_status}
          acceptedName={contract.accepted_name}
        />

        {contract.contract_status === "accepted" && contract.accepted_at && (
          <div className="contract-acceptance-record">
            <small>REGISTRO DE ACEITE</small>
            <b>{contract.accepted_name}</b>
            <span>{dateLabel(contract.accepted_at)}</span>
          </div>
        )}

        <div className="public-proposal-footer">
          <span>🔥 Brasa Pro</span>
          <p>Contrato gerado a partir de uma proposta aprovada no Brasa Pro.</p>
        </div>
      </section>
    </main>
  );
}
