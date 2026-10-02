"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const statuses = [
  ["invited", "Convidado"],
  ["confirmed", "Confirmado"],
  ["declined", "Recusou"],
  ["completed", "Concluído"],
] as const;

export default function EventTeamStatusSelect({
  assignmentId,
  status,
}: {
  assignmentId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function change(next: string) {
    setValue(next);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("set_event_team_status", {
      p_assignment_id: assignmentId,
      p_status: next,
    });

    if (error) setValue(status);

    setSaving(false);
    router.refresh();
  }

  return (
    <label className="team-status-select">
      <span>{saving ? "Salvando..." : "Status"}</span>
      <select value={value} onChange={(event) => change(event.target.value)} disabled={saving}>
        {statuses.map(([key, label]) => (
          <option value={key} key={key}>{label}</option>
        ))}
      </select>
    </label>
  );
}
