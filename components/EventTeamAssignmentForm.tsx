"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MemberOption = {
  id: string;
  name: string;
  default_role: string;
  default_daily_rate: number;
};

export default function EventTeamAssignmentForm({
  eventId,
  members,
}: {
  eventId: string;
  members: MemberOption[];
}) {
  const router = useRouter();
  const [memberId, setMemberId] = useState(members[0]?.id || "");
  const selected = useMemo(
    () => members.find((member) => member.id === memberId) || members[0],
    [memberId, members],
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const pickedMemberId = String(form.get("memberId") || "");
    const role = String(form.get("role") || "").trim();
    const dailyRate = Number(form.get("dailyRate") || 0);
    const days = Number(form.get("days") || 1);
    const startTime = String(form.get("startTime") || "");
    const endTime = String(form.get("endTime") || "");
    const status = String(form.get("status") || "invited");
    const notes = String(form.get("notes") || "").trim();

    if (!pickedMemberId || !role) {
      setMessage("Selecione o profissional e informe a função.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("event_team_assignments").insert({
      user_id: user.id,
      event_id: eventId,
      member_id: pickedMemberId,
      role,
      daily_rate: Math.max(0, dailyRate),
      days: Math.max(0.25, days),
      start_time: startTime || null,
      end_time: endTime || null,
      status,
      notes,
    });

    if (error) {
      setMessage(
        error.code === "23505"
          ? "Esse profissional já está escalado neste evento."
          : error.message,
      );
      setLoading(false);
      return;
    }

    setMessage("Profissional adicionado à escala.");
    setLoading(false);
    router.refresh();
  }

  if (members.length === 0) {
    return (
      <div className="compact-empty">
        <span>👥</span>
        <b>Cadastre sua equipe primeiro</b>
        <p>Adicione profissionais na área Equipe para montar a escala deste evento.</p>
      </div>
    );
  }

  return (
    <form className="workspace-form team-assignment-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Profissional
          <select
            name="memberId"
            value={memberId}
            onChange={(event) => setMemberId(event.target.value)}
          >
            {members.map((member) => (
              <option value={member.id} key={member.id}>{member.name}</option>
            ))}
          </select>
        </label>

        <label>
          Função no evento
          <input
            key={"role-" + selected?.id}
            name="role"
            defaultValue={selected?.default_role || "Auxiliar"}
          />
        </label>

        <label>
          Diária
          <input
            key={"rate-" + selected?.id}
            name="dailyRate"
            min={0}
            step="0.01"
            type="number"
            defaultValue={selected?.default_daily_rate || 0}
          />
        </label>

        <label>
          Nº de diárias
          <input name="days" min={0.25} step="0.25" type="number" defaultValue={1} />
        </label>

        <label>
          Status
          <select name="status" defaultValue="invited">
            <option value="invited">Convidado</option>
            <option value="confirmed">Confirmado</option>
            <option value="declined">Recusou</option>
            <option value="completed">Concluído</option>
          </select>
        </label>

        <label>
          Entrada
          <input name="startTime" type="time" />
        </label>

        <label>
          Saída
          <input name="endTime" type="time" />
        </label>

        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={2} placeholder="Chegar antes, levar equipamento, função específica..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Escalando..." : "+ Adicionar à escala"}
      </button>
    </form>
  );
}
