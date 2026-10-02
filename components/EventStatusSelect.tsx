"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const options = [
  ["lead", "Lead"],
  ["quote", "Orçamento"],
  ["approved", "Aprovado"],
  ["scheduled", "Agendado"],
  ["completed", "Concluído"],
  ["cancelled", "Cancelado"],
] as const;

export default function EventStatusSelect({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function update(nextStatus: string) {
    setValue(nextStatus);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", eventId);

    if (error) setValue(status);

    setSaving(false);
    router.refresh();
  }

  return (
    <label className="agenda-status-select">
      <span>{saving ? "Salvando..." : "Status"}</span>
      <select value={value} onChange={(event) => update(event.target.value)} disabled={saving}>
        {options.map(([key, label]) => (
          <option value={key} key={key}>{label}</option>
        ))}
      </select>
    </label>
  );
}
