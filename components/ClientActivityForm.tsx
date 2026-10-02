"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientActivityForm({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [type, setType] = useState("whatsapp");
  const [content, setContent] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    if (!content.trim()) {
      setMessage("Descreva o contato ou observação.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("client_activities").insert({
      user_id: user.id,
      client_id: clientId,
      activity_type: type,
      content: content.trim(),
      occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (["call", "whatsapp", "email", "meeting"].includes(type)) {
      await supabase.rpc("touch_client_contact", { p_client_id: clientId });
    }

    setContent("");
    setOccurredAt("");
    setMessage("Interação registrada.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form crm-activity-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label>
          Tipo
          <select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="whatsapp">WhatsApp</option>
            <option value="call">Ligação</option>
            <option value="email">E-mail</option>
            <option value="meeting">Reunião</option>
            <option value="follow_up">Follow-up</option>
            <option value="note">Observação</option>
          </select>
        </label>

        <label>
          Data/hora
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => setOccurredAt(event.target.value)}
          />
        </label>

        <label className="form-span-2">
          Registro
          <textarea
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Ex.: pediu orçamento para 80 pessoas e quer fechar até sexta-feira."
          />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Registrando..." : "+ Registrar interação"}
      </button>
    </form>
  );
}
