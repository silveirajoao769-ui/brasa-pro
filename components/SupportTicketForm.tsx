"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupportTicketForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const subject = String(form.get("subject") || "").trim();
    const category = String(form.get("category") || "other");
    const content = String(form.get("content") || "").trim();

    if (subject.length < 4 || content.length < 4) {
      setMessage("Descreva o assunto e a mensagem com um pouco mais de detalhe.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("support_tickets")
      .insert({
        user_id: user.id,
        subject,
        category,
        status: "open",
      })
      .select("id")
      .single();

    if (ticketError || !ticket) {
      setMessage(ticketError?.message || "Não foi possível abrir o chamado.");
      setLoading(false);
      return;
    }

    const { error: messageError } = await supabase
      .from("support_messages")
      .insert({
        ticket_id: ticket.id,
        user_id: user.id,
        author_type: "user",
        content,
      });

    if (messageError) {
      await supabase.from("support_tickets").delete().eq("id", ticket.id);
      setMessage(messageError.message || "Não foi possível enviar sua mensagem.");
      setLoading(false);
      return;
    }

    router.push("/suporte/" + ticket.id);
    router.refresh();
  }

  return (
    <form className="workspace-form support-ticket-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label>
          Categoria
          <select name="category" defaultValue="technical">
            <option value="technical">Problema técnico</option>
            <option value="billing">Cobrança / plano</option>
            <option value="account">Conta e acesso</option>
            <option value="feature">Dúvida sobre recurso</option>
            <option value="other">Outro assunto</option>
          </select>
        </label>

        <label>
          Assunto
          <input name="subject" maxLength={120} placeholder="Ex.: não consigo abrir meu evento" />
        </label>

        <label className="form-span-2">
          Mensagem
          <textarea
            name="content"
            rows={5}
            maxLength={4000}
            placeholder="Conte o que aconteceu, o que você tentou fazer e o que apareceu na tela."
          />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Abrindo chamado..." : "Abrir chamado →"}
      </button>
    </form>
  );
}
