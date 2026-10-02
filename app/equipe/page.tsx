import Link from "next/link";
import { redirect } from "next/navigation";
import TeamMemberForm from "@/components/TeamMemberForm";
import TeamMemberEditor from "@/components/TeamMemberEditor";
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
  invited: "Convidado",
  confirmed: "Confirmado",
  declined: "Recusou",
  completed: "Concluído",
};

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Gestão de equipe");

  const [{ data: members }, { data: assignments }, { data: events }] = await Promise.all([
    supabase
      .from("team_members")
      .select("id, name, phone, email, default_role, default_daily_rate, active, notes, created_at")
      .eq("user_id", user.id)
      .order("active", { ascending: false })
      .order("name"),
    supabase
      .from("event_team_assignments")
      .select("id, event_id, member_id, role, daily_rate, days, start_time, end_time, status, notes, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("events")
      .select("id, title, event_date, status")
      .eq("user_id", user.id),
  ]);

  const memberRows = members || [];
  const assignmentRows = assignments || [];
  const eventRows = events || [];
  const memberMap = new Map(memberRows.map((member) => [member.id, member]));
  const eventMap = new Map(eventRows.map((event) => [event.id, event]));

  const activeMembers = memberRows.filter((member) => member.active);
  const confirmedAssignments = assignmentRows.filter((assignment) =>
    ["confirmed", "completed"].includes(assignment.status),
  );
  const committedCost = confirmedAssignments.reduce(
    (sum, assignment) => sum + Number(assignment.daily_rate || 0) * Number(assignment.days || 1),
    0,
  );

  const now = new Date();
  const upcomingAssignments = assignmentRows
    .filter((assignment) => {
      const event = eventMap.get(assignment.event_id);
      return Boolean(
        event?.event_date &&
        new Date(event.event_date) >= now &&
        event.status !== "cancelled",
      );
    })
    .sort((a, b) => {
      const aDate = eventMap.get(a.event_id)?.event_date || "";
      const bDate = eventMap.get(b.event_id)?.event_date || "";
      return aDate.localeCompare(bDate);
    });

  return (
    <main className="workspace-page team-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>EQUIPE</small></span>
        </Link>
        <div className="detail-actions">
          <Link href="/agenda" className="ghost-button">Agenda</Link>
          <Link href="/eventos" className="ghost-button">Eventos</Link>
          <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
        </div>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">PESSOAS E ESCALAS</span>
            <h1>Sua equipe de eventos.</h1>
            <p>Cadastre profissionais, acompanhe diárias e veja quem está escalado nos próximos trabalhos.</p>
          </div>
          <span className="workspace-count">{activeMembers.length} ativos</span>
        </div>

        <div className="team-overview">
          <article>
            <small>PROFISSIONAIS ATIVOS</small>
            <strong>{activeMembers.length}</strong>
            <span>Disponíveis para escala</span>
          </article>
          <article>
            <small>PRÓXIMAS ESCALAS</small>
            <strong>{upcomingAssignments.length}</strong>
            <span>Vínculos com eventos futuros</span>
          </article>
          <article>
            <small>CONFIRMADOS</small>
            <strong>{assignmentRows.filter((item) => item.status === "confirmed").length}</strong>
            <span>Escalas já aceitas</span>
          </article>
          <article>
            <small>CUSTO COMPROMETIDO</small>
            <strong>{money(committedCost)}</strong>
            <span>Confirmados e concluídos</span>
          </article>
        </div>

        <div className="team-main-grid">
          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>CADASTRO</small><h2>Novo profissional</h2></div>
            </div>
            <TeamMemberForm />
          </article>

          <article className="workspace-panel">
            <div className="panel-heading">
              <div><small>SUA BASE</small><h2>Profissionais</h2></div>
              <span className="workspace-count">{memberRows.length}</span>
            </div>

            {memberRows.length === 0 ? (
              <div className="compact-empty">
                <span>👥</span>
                <b>Nenhum profissional cadastrado</b>
                <p>Monte sua equipe para começar a criar escalas por evento.</p>
              </div>
            ) : (
              <div className="team-member-list">
                {memberRows.map((member) => (
                  <div className={member.active ? "team-member-row" : "team-member-row inactive"} key={member.id}>
                    <div className="record-avatar">{member.name.slice(0, 2).toUpperCase()}</div>
                    <div className="team-member-main">
                      <b>{member.name}</b>
                      <span>{member.default_role}</span>
                      <small>{member.phone || member.email || "Sem contato informado"}</small>
                    </div>
                    <div className="team-member-rate">
                      <small>DIÁRIA PADRÃO</small>
                      <strong>{money(Number(member.default_daily_rate || 0))}</strong>
                    </div>
                    <TeamMemberEditor member={member} />
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>

        <article className="workspace-panel team-schedule-panel">
          <div className="panel-heading">
            <div><small>PRÓXIMOS TRABALHOS</small><h2>Escalas futuras</h2></div>
          </div>

          {upcomingAssignments.length === 0 ? (
            <div className="compact-empty">
              <span>📅</span>
              <b>Nenhuma escala futura</b>
              <p>Entre em um evento e adicione profissionais à escala.</p>
            </div>
          ) : (
            <div className="team-schedule-list">
              {upcomingAssignments.slice(0, 16).map((assignment) => {
                const member = memberMap.get(assignment.member_id);
                const event = eventMap.get(assignment.event_id);
                const cost = Number(assignment.daily_rate || 0) * Number(assignment.days || 1);

                return (
                  <Link href={"/eventos/" + assignment.event_id} className="team-schedule-row" key={assignment.id}>
                    <div>
                      <small>{dateLabel(event?.event_date || null)}</small>
                      <b>{event?.title || "Evento"}</b>
                    </div>
                    <div>
                      <span>Profissional</span>
                      <b>{member?.name || "Equipe"}</b>
                    </div>
                    <div>
                      <span>Função</span>
                      <b>{assignment.role}</b>
                    </div>
                    <div>
                      <span>Status</span>
                      <b>{statusLabels[assignment.status] || assignment.status}</b>
                    </div>
                    <strong>{money(cost)}</strong>
                    <span className="event-arrow">→</span>
                  </Link>
                );
              })}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
