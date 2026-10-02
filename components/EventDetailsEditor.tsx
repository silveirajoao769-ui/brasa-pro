"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClientOption = { id: string; name: string };

export default function EventDetailsEditor({
  event,
  clients,
}: {
  event: {
    id: string;
    title: string;
    client_id: string | null;
    event_date: string | null;
    guests: number;
    revenue: number | string;
    status: string;
    notes: string;
  };
  clients: ClientOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(formEvent.currentTarget);
    const title = String(form.get("title") || "").trim();
    const date = String(form.get("eventDate") || "");

    if (!title) {
      setMessage("Informe o nome do evento.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("events")
      .update({
        title,
        client_id: String(form.get("clientId") || "") || null,
        event_date: date ? new Date(date + "T12:00:00").toISOString() : null,
        guests: Math.max(0, Number(form.get("guests") || 0)),
        revenue: Math.max(0, Number(form.get("revenue") || 0)),
        status: String(form.get("status") || "lead"),
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", event.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Evento atualizado.");
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="inline-editor event-inline-editor">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar edição" : "Editar evento"}
      </button>

      {open && (
        <form className="workspace-form inline-editor-form" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label className="form-span-2">
              Nome do evento
              <input name="title" defaultValue={event.title} />
            </label>
            <label>
              Cliente
              <select name="clientId" defaultValue={event.client_id || ""}>
                <option value="">Sem cliente</option>
                {clients.map((client) => <option value={client.id} key={client.id}>{client.name}</option>)}
              </select>
            </label>
            <label>
              Data
              <input
                name="eventDate"
                type="date"
                defaultValue={event.event_date ? new Date(event.event_date).toISOString().slice(0, 10) : ""}
              />
            </label>
            <label>
              Convidados
              <input name="guests" min={0} type="number" defaultValue={event.guests || 0} />
            </label>
            <label>
              Receita prevista
              <input name="revenue" min={0} step="0.01" type="number" defaultValue={Number(event.revenue || 0)} />
            </label>
            <label>
              Status
              <select name="status" defaultValue={event.status}>
                <option value="lead">Lead</option>
                <option value="quote">Orçamento</option>
                <option value="approved">Aprovado</option>
                <option value="scheduled">Agendado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </label>
            <label className="form-span-2">
              Observações
              <textarea name="notes" rows={3} defaultValue={event.notes || ""} />
            </label>
          </div>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar evento"}
          </button>
        </form>
      )}
    </div>
  );
}
