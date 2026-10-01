"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const phone = String(form.get("phone") || "").trim();
    const email = String(form.get("email") || "").trim();
    const notes = String(form.get("notes") || "").trim();

    if (!name) {
      setMessage("Informe o nome do cliente.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("clients").insert({
      user_id: user.id,
      name,
      phone: phone || null,
      email: email || null,
      notes,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Cliente adicionado.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label>
          Nome
          <input name="name" placeholder="Nome do cliente" />
        </label>
        <label>
          Telefone
          <input name="phone" placeholder="(00) 00000-0000" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" placeholder="cliente@email.com" />
        </label>
        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={3} placeholder="Preferências, restrições, informações do cliente..." />
        </label>
      </div>
      {message && <div className="form-message">{message}</div>}
      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar cliente"}
      </button>
    </form>
  );
}
