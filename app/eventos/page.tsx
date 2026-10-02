import Link from "next/link";
import { redirect } from "next/navigation";
import EventForm from "@/components/EventForm";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function dateLabel(value: string | null) {
  if (!value) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
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

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Eventos profissionais");

  const [{ data: clients }, { data: events }] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id)
      .order("name"),
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status, client_id, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const clientMap = new Map((clients || []).map((client) => [client.id, client.name]));

  return (
    <main className="workspace-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>EVENTOS</small></span>
        </Link>
        <Link href="/dashboard" className="ghost-button">← Dashboard</Link>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">ÁREA PROFISSIONAL</span>
            <h1>Eventos</h1>
            <p>Cadastre trabalhos, acompanhe receita e depois lance todos os custos.</p>
          </div>
          <span className="workspace-count">{events?.length || 0} eventos</span>
        </div>

        <div className="workspace-layout">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>NOVO EVENTO</small><h2>Criar evento</h2></div>
            </div>
            <EventForm clients={clients || []} />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>HISTÓRICO</small><h2>Seus eventos</h2></div>
            </div>

            {!events || events.length === 0 ? (
              <div className="compact-empty">
                <span>📅</span>
                <b>Nenhum evento cadastrado</b>
                <p>Crie seu primeiro evento profissional usando o formulário.</p>
              </div>
            ) : (
              <div className="records-list">
                {events.map((event) => (
                  <Link href={"/eventos/" + event.id} className="record-row record-link" key={event.id}>
                    <div className="record-avatar">🔥</div>
                    <div className="record-main">
                      <b>{event.title}</b>
                      <span>
                        {dateLabel(event.event_date)} · {event.guests} pessoas
                        {event.client_id ? " · " + (clientMap.get(event.client_id) || "Cliente") : ""}
                      </span>
                    </div>
                    <div className="record-value">
                      <b>{money(Number(event.revenue || 0))}</b>
                      <small>{statusLabels[event.status] || event.status}</small>
                    </div>
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
