import Link from "next/link";
import { redirect } from "next/navigation";
import EventTaskForm from "@/components/EventTaskForm";
import EventTaskToggle from "@/components/EventTaskToggle";
import EventStatusSelect from "@/components/EventStatusSelect";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
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

function dateTimeLabel(value: string | null) {
  if (!value) return "Sem prazo";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dayNumber(value: string | null) {
  if (!value) return "--";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(new Date(value));
}

function monthLabel(value: string | null) {
  if (!value) return "SEM DATA";
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(value))
    .replace(".", "")
    .toUpperCase();
}

const statusLabels: Record<string, string> = {
  lead: "Lead",
  quote: "Orçamento",
  approved: "Aprovado",
  scheduled: "Agendado",
  completed: "Concluído",
  cancelled: "Cancelado",
};

export default async function AgendaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Agenda profissional");

  const [{ data: events }, { data: clients }, { data: tasks }] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status, client_id, notes")
      .eq("user_id", user.id)
      .neq("status", "cancelled")
      .order("event_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("clients")
      .select("id, name")
      .eq("user_id", user.id),
    supabase
      .from("event_tasks")
      .select("id, event_id, title, notes, due_at, completed, completed_at, created_at")
      .eq("user_id", user.id)
      .order("completed", { ascending: true })
      .order("due_at", { ascending: true, nullsFirst: false }),
  ]);

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const inThirtyDays = new Date(todayStart);
  inThirtyDays.setDate(inThirtyDays.getDate() + 30);

  const eventRows = events || [];
  const taskRows = tasks || [];
  const clientMap = new Map((clients || []).map((client) => [client.id, client.name]));
  const eventMap = new Map(eventRows.map((event) => [event.id, event]));

  const upcomingEvents = eventRows.filter((event) => {
    if (!event.event_date) return false;
    const date = new Date(event.event_date);
    return date >= todayStart && event.status !== "completed";
  });

  const nextThirtyDays = upcomingEvents.filter((event) => {
    const date = new Date(event.event_date!);
    return date <= inThirtyDays;
  });

  const openTasks = taskRows.filter((task) => !task.completed);
  const overdueTasks = openTasks.filter(
    (task) => task.due_at && new Date(task.due_at) < now,
  );
  const completedTasks = taskRows.filter((task) => task.completed);
  const forecastRevenue = nextThirtyDays.reduce(
    (sum, event) => sum + Number(event.revenue || 0),
    0,
  );

  return (
    <main className="workspace-page agenda-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>AGENDA PROFISSIONAL</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">OPERAÇÃO E PRAZOS</span>
            <h1>Sua agenda de eventos.</h1>
            <p>Veja o que vem pela frente, acompanhe cada trabalho e não deixe nenhuma pendência passar.</p>
          </div>
          <span className="workspace-count">{upcomingEvents.length} próximos</span>
        </div>

        <div className="agenda-overview">
          <article>
            <small>PRÓXIMOS 30 DIAS</small>
            <strong>{nextThirtyDays.length}</strong>
            <span>Eventos confirmados ou em andamento</span>
          </article>
          <article>
            <small>RECEITA PREVISTA</small>
            <strong>{money(forecastRevenue)}</strong>
            <span>Nos próximos 30 dias</span>
          </article>
          <article className={openTasks.length > 0 ? "agenda-attention" : ""}>
            <small>TAREFAS ABERTAS</small>
            <strong>{openTasks.length}</strong>
            <span>Pendências da operação</span>
          </article>
          <article className={overdueTasks.length > 0 ? "agenda-danger" : ""}>
            <small>ATRASADAS</small>
            <strong>{overdueTasks.length}</strong>
            <span>Precisam de atenção agora</span>
          </article>
        </div>

        {overdueTasks.length > 0 && (
          <div className="stock-alert-strip agenda-alert-strip">
            <span>⏰</span>
            <div>
              <b>{overdueTasks.length} tarefa(s) atrasada(s)</b>
              <p>{overdueTasks.slice(0, 3).map((task) => task.title).join(" · ")}</p>
            </div>
          </div>
        )}

        <div className="agenda-main-grid">
          <article className="workspace-panel agenda-events-panel">
            <div className="panel-heading">
              <div><small>CALENDÁRIO DE TRABALHOS</small><h2>Próximos eventos</h2></div>
              <Link href="/eventos" className="ghost-button">+ Novo evento</Link>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="compact-empty">
                <span>📅</span>
                <b>Nenhum evento futuro</b>
                <p>Quando um evento receber uma data, ele aparecerá aqui automaticamente.</p>
              </div>
            ) : (
              <div className="agenda-event-list">
                {upcomingEvents.slice(0, 14).map((event) => (
                  <div className="agenda-event-card" key={event.id}>
                    <Link href={"/eventos/" + event.id} className="agenda-date-block">
                      <strong>{dayNumber(event.event_date)}</strong>
                      <span>{monthLabel(event.event_date)}</span>
                    </Link>

                    <Link href={"/eventos/" + event.id} className="agenda-event-main">
                      <small>{statusLabels[event.status] || event.status}</small>
                      <b>{event.title}</b>
                      <span>
                        {dateLabel(event.event_date)} · {event.guests} convidados
                        {event.client_id ? " · " + (clientMap.get(event.client_id) || "Cliente") : ""}
                      </span>
                    </Link>

                    <div className="agenda-event-value">
                      <small>RECEITA</small>
                      <strong>{money(Number(event.revenue || 0))}</strong>
                    </div>

                    <EventStatusSelect eventId={event.id} status={event.status} />
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="workspace-panel agenda-create-panel">
            <div className="panel-heading">
              <div><small>NOVA PENDÊNCIA</small><h2>Adicionar tarefa</h2></div>
            </div>
            <EventTaskForm
              events={upcomingEvents.map((event) => ({
                id: event.id,
                title: event.title,
                event_date: event.event_date,
              }))}
            />
          </article>
        </div>

        <div className="agenda-task-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CHECKLIST OPERACIONAL</small><h2>Tarefas abertas</h2></div>
              <span className="workspace-count">{openTasks.length}</span>
            </div>

            {openTasks.length === 0 ? (
              <div className="compact-empty">
                <span>✓</span>
                <b>Nenhuma pendência</b>
                <p>Sua operação está em dia.</p>
              </div>
            ) : (
              <div className="agenda-task-list">
                {openTasks.map((task) => {
                  const linkedEvent = task.event_id ? eventMap.get(task.event_id) : null;
                  const overdue = Boolean(task.due_at && new Date(task.due_at) < now);

                  return (
                    <div className={overdue ? "agenda-task-row overdue" : "agenda-task-row"} key={task.id}>
                      <EventTaskToggle taskId={task.id} completed={task.completed} />
                      <div className="agenda-task-main">
                        <b>{task.title}</b>
                        <span>
                          {linkedEvent ? linkedEvent.title : "Tarefa geral"}
                          {task.due_at ? " · " + dateTimeLabel(task.due_at) : ""}
                        </span>
                        {task.notes && <small>{task.notes}</small>}
                      </div>
                      {overdue && <em>ATRASADA</em>}
                      {linkedEvent && (
                        <Link href={"/eventos/" + linkedEvent.id} className="event-arrow">→</Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CONCLUÍDAS</small><h2>Últimas finalizadas</h2></div>
            </div>

            {completedTasks.length === 0 ? (
              <div className="compact-empty">
                <span>☑</span>
                <b>Nada concluído ainda</b>
                <p>As tarefas finalizadas aparecerão neste histórico.</p>
              </div>
            ) : (
              <div className="agenda-task-list completed">
                {completedTasks.slice(0, 8).map((task) => (
                  <div className="agenda-task-row" key={task.id}>
                    <EventTaskToggle taskId={task.id} completed={task.completed} />
                    <div className="agenda-task-main">
                      <b>{task.title}</b>
                      <span>
                        {task.completed_at ? "Concluída em " + dateTimeLabel(task.completed_at) : "Concluída"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      </section>
    </main>
  );
}
