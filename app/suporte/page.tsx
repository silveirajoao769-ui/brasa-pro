import Link from "next/link";
import { redirect } from "next/navigation";
import SupportTicketForm from "@/components/SupportTicketForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_user: "Aguardando você",
  resolved: "Resolvido",
  closed: "Encerrado",
};

const categoryLabels: Record<string, string> = {
  technical: "Técnico",
  billing: "Cobrança",
  account: "Conta",
  feature: "Recurso",
  other: "Outro",
};

function dateTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function SupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, ticket_number, subject, category, status, last_message_at, created_at")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  const rows = tickets || [];

  return (
    <main className="workspace-page support-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>AJUDA E SUPORTE</small></span>
        </Link>
        <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">SUPORTE DENTRO DO BRASA PRO</span>
            <h1>Como podemos ajudar?</h1>
            <p>Abra um chamado, acompanhe o status e mantenha todo o histórico de atendimento na sua conta.</p>
          </div>
          <span className="workspace-count">{rows.length} chamado(s)</span>
        </div>

        <div className="support-main-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO CHAMADO</small><h2>Fale com o suporte</h2></div>
            </div>
            <SupportTicketForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SEU HISTÓRICO</small><h2>Chamados</h2></div>
            </div>

            {rows.length === 0 ? (
              <div className="compact-empty">
                <span>?</span>
                <b>Nenhum chamado aberto</b>
                <p>Quando precisar de ajuda, seu histórico aparecerá aqui.</p>
              </div>
            ) : (
              <div className="support-ticket-list">
                {rows.map((ticket) => (
                  <Link href={"/suporte/" + ticket.id} className="support-ticket-row" key={ticket.id}>
                    <span className={"support-ticket-status " + ticket.status}>
                      {statusLabels[ticket.status] || ticket.status}
                    </span>
                    <div>
                      <small>#{ticket.ticket_number} · {categoryLabels[ticket.category] || ticket.category}</small>
                      <b>{ticket.subject}</b>
                      <span>Última atividade: {dateTime(ticket.last_message_at)}</span>
                    </div>
                    <span className="event-arrow">→</span>
                  </Link>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
