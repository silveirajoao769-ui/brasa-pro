"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SupplierForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();

    if (!name) {
      setMessage("Informe o nome do fornecedor.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("suppliers").insert({
      user_id: user.id,
      name,
      contact_name: String(form.get("contactName") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      website: String(form.get("website") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
      state: String(form.get("state") || "").trim() || null,
      notes: String(form.get("notes") || "").trim(),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Fornecedor adicionado.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Nome do fornecedor
          <input name="name" placeholder="Ex.: Açougue Central" />
        </label>
        <label>
          Contato
          <input name="contactName" placeholder="Nome do vendedor" />
        </label>
        <label>
          Telefone
          <input name="phone" placeholder="(00) 00000-0000" />
        </label>
        <label>
          E-mail
          <input name="email" type="email" placeholder="contato@fornecedor.com" />
        </label>
        <label>
          Site
          <input name="website" placeholder="https://..." />
        </label>
        <label>
          Cidade
          <input name="city" placeholder="Cidade" />
        </label>
        <label>
          Estado
          <input name="state" maxLength={2} placeholder="SC" />
        </label>
        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={3} placeholder="Condições, prazo, formas de pagamento..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar fornecedor"}
      </button>
    </form>
  );
}
