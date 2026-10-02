"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EventOption = {
  id: string;
  title: string;
  event_date: string | null;
};

export default function EventTaskForm({ events }: { events: EventOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const eventId = String(form.get("eventId") || "");
    const dueAt = String(form.get("dueAt") || "");
    const notes = String(form.get("notes") || "").trim();

    if (!title) {
      setMessage("Informe a tarefa.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("event_tasks").insert({
      user_id: user.id,
      event_id: eventId || null,
      title,
      notes,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Tarefa adicionada à agenda.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form agenda-task-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Tarefa
          <input name="title" placeholder="Ex.: Confirmar quantidade final de convidados" />
        </label>

        <label>
          Evento
          <select name="eventId" defaultValue="">
            <option value="">Tarefa geral</option>
            {events.map((item) => (
              <option value={item.id} key={item.id}>{item.title}</option>
            ))}
          </select>
        </label>

        <label>
          Prazo
          <input name="dueAt" type="datetime-local" />
        </label>

        <label className="form-span-2">
          Observação
          <textarea name="notes" rows={3} placeholder="Detalhes, contato, itens que precisam ser verificados..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar tarefa"}
      </button>
    </form>
  );
}
