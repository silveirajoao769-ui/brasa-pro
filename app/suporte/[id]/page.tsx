import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import SupportMessageForm from "@/components/SupportMessageForm";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

const statusLabels: Record<string, string> = {
  open: "Aberto",
  in_progress: "Em atendimento",
  waiting_user: "Aguardando você",
  resolved: "Resolvido",
  closed: "Encerrado",
};

const categoryLabels: Record<string, string> = {
  technical: "Problema técnico",
  billing: "Cobrança / plano",
  account: "Conta e acesso",
  feature: "Dúvida sobre recurso",
  other: "Outro assunto",
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

export default async function SupportDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: ticket }, { data: messages }] = await Promise.all([
    supabase
      .from("support_tickets")
      .select("id, ticket_number, subject, category, status, created_at, last_message_at")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("support_messages")
      .select("id, user_id, author_type, content, created_at")
      .eq("ticket_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (!ticket) notFound();

  const closed = ["resolved", "closed"].includes(ticket.status);

  return (
    <main className="detail-page support-detail-page">
      <div className="shell detail-topbar">
        <Link href="/suporte" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CHAMADO #{ticket.ticket_number}</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/suporte" className="primary-button compact">← Suporte</Link>
        </div>
      </div>

      <section className="shell detail-content">
        <div className="detail-heading">
          <div>
            <span className="eyebrow">{categoryLabels[ticket.category] || ticket.category}</span>
            <h1>{ticket.subject}</h1>
            <p>Aberto em {dateTime(ticket.created_at)}</p>
          </div>
          <span className={"detail-status support-status-" + ticket.status}>
            {statusLabels[ticket.status] || ticket.status}
          </span>
        </div>

        <article className="detail-panel support-conversation-panel">
          <div className="panel-heading">
            <div><small>CONVERSA</small><h2>Histórico do atendimento</h2></div>
          </div>

          <div className="support-thread">
            {(messages || []).map((message) => (
              <div
                className={message.author_type === "support" ? "support-message support" : "support-message user"}
                key={message.id}
              >
                <div className="support-message-meta">
                  <b>{message.author_type === "support" ? "Suporte Brasa Pro" : "Você"}</b>
                  <span>{dateTime(message.created_at)}</span>
                </div>
                <p>{message.content}</p>
              </div>
            ))}
          </div>

          {closed ? (
            <div className="support-closed-note">
              <span>✓</span>
              <div>
                <b>Este chamado foi {ticket.status === "resolved" ? "resolvido" : "encerrado"}.</b>
                <p>Se precisar de ajuda novamente, abra um novo chamado.</p>
              </div>
            </div>
          ) : (
            <SupportMessageForm ticketId={ticket.id} />
          )}
        </article>
      </section>
    </main>
  );
}
