"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function EventTaskEditor({
  task,
}: {
  task: {
    id: string;
    title: string;
    due_at: string | null;
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
    const dueAt = String(form.get("dueAt") || "");
    const supabase = createClient();

    await supabase
      .from("event_tasks")
      .update({
        title: String(form.get("title") || "").trim(),
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", task.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions task-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="event_tasks"
        id={task.id}
        confirmText="Excluir esta tarefa?"
      />
      {open && (
        <form className="workspace-form inline-row-editor task-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label className="form-span-2">
              Tarefa
              <input name="title" defaultValue={task.title} />
            </label>
            <label>
              Prazo
              <input
                name="dueAt"
                type="datetime-local"
                defaultValue={task.due_at ? new Date(task.due_at).toISOString().slice(0, 16) : ""}
              />
            </label>
            <label className="form-span-2">
              Observação
              <input name="notes" defaultValue={task.notes || ""} />
            </label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar tarefa"}
          </button>
        </form>
      )}
    </div>
  );
}
