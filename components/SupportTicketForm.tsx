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

    const { data: ticketId, error } = await supabase.rpc("create_support_ticket", {
      p_subject: subject,
      p_category: category,
      p_content: content,
    });

    if (error || !ticketId) {
      setMessage(error?.message || "Não foi possível abrir o chamado.");
      setLoading(false);
      return;
    }

    router.push("/suporte/" + ticketId);
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
