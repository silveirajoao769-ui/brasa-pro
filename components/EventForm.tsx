"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ClientOption = {
  id: string;
  name: string;
};

export default function EventForm({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const clientId = String(form.get("clientId") || "");
    const eventDate = String(form.get("eventDate") || "");
    const guests = Number(form.get("guests") || 0);
    const revenue = Number(form.get("revenue") || 0);
    const status = String(form.get("status") || "lead");
    const notes = String(form.get("notes") || "").trim();

    if (!title) {
      setMessage("Informe o nome do evento.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        user_id: user.id,
        client_id: clientId || null,
        title,
        event_date: eventDate ? new Date(eventDate + "T12:00:00").toISOString() : null,
        guests: Math.max(0, guests),
        revenue: Math.max(0, revenue),
        status,
        notes,
      })
      .select("id")
      .single();

    if (error || !data) {
      setMessage(error?.message || "Não foi possível criar o evento.");
      setLoading(false);
      return;
    }

    router.push("/eventos/" + data.id);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Nome do evento
          <input name="title" placeholder="Ex.: Casamento Fernanda e Lucas" />
        </label>

        <label>
          Cliente
          <select name="clientId" defaultValue="">
            <option value="">Sem cliente vinculado</option>
            {clients.map((client) => (
              <option value={client.id} key={client.id}>{client.name}</option>
            ))}
          </select>
        </label>

        <label>
          Data
          <input name="eventDate" type="date" />
        </label>

        <label>
          Convidados
          <input name="guests" min={0} type="number" defaultValue={50} />
        </label>

        <label>
          Receita prevista
          <input name="revenue" min={0} step="0.01" type="number" placeholder="5000" />
        </label>

        <label>
          Status
          <select name="status" defaultValue="lead">
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
          <textarea name="notes" rows={3} placeholder="Cardápio, equipe, local, observações..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Criando evento..." : "Criar evento →"}
      </button>
    </form>
  );
}
