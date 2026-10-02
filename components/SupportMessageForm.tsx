"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupportMessageForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const text = content.trim();
    if (!text) {
      setMessage("Digite uma mensagem.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("support_messages").insert({
      ticket_id: ticketId,
      user_id: user.id,
      author_type: "user",
      content: text,
    });

    if (error) {
      setMessage(error.message || "Não foi possível enviar.");
      setLoading(false);
      return;
    }

    setContent("");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="support-reply-form" onSubmit={submit}>
      <textarea
        rows={4}
        maxLength={4000}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        placeholder="Escreva sua resposta..."
      />
      <div className="support-reply-footer">
        <small>{content.length}/4000</small>
        <button className="primary-button compact" type="submit" disabled={loading}>
          {loading ? "Enviando..." : "Enviar mensagem"}
        </button>
      </div>
      {message && <div className="form-message">{message}</div>}
    </form>
  );
}
