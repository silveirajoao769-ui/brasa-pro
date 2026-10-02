"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function EventTeamAssignmentEditor({
  assignment,
}: {
  assignment: {
    id: string;
    role: string;
    daily_rate: number | string;
    days: number | string;
    start_time: string | null;
    end_time: string | null;
    notes: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    await supabase
      .from("event_team_assignments")
      .update({
        role: String(form.get("role") || "Auxiliar").trim(),
        daily_rate: Math.max(0, Number(form.get("dailyRate") || 0)),
        days: Math.max(0.25, Number(form.get("days") || 1)),
        start_time: String(form.get("startTime") || "") || null,
        end_time: String(form.get("endTime") || "") || null,
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", assignment.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions assignment-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="event_team_assignments"
        id={assignment.id}
        confirmText="Remover este profissional da escala?"
      />
      {open && (
        <form className="workspace-form inline-row-editor assignment-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Função</span><input name="role" defaultValue={assignment.role} /></label>
            <label><span>Diária</span><input name="dailyRate" type="number" min={0} step="0.01" defaultValue={Number(assignment.daily_rate)} /></label>
            <label><span>Diárias</span><input name="days" type="number" min={0.25} step="0.25" defaultValue={Number(assignment.days)} /></label>
            <label><span>Entrada</span><input name="startTime" type="time" defaultValue={assignment.start_time?.slice(0, 5) || ""} /></label>
            <label><span>Saída</span><input name="endTime" type="time" defaultValue={assignment.end_time?.slice(0, 5) || ""} /></label>
            <label className="form-span-2"><span>Observações</span><input name="notes" defaultValue={assignment.notes || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar escala"}
          </button>
        </form>
      )}
    </div>
  );
}
