"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ClientProfileEditor({
  client,
}: {
  client: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    notes: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();

    if (!name) {
      setMessage("Informe o nome do cliente.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase
      .from("clients")
      .update({
        name,
        phone: String(form.get("phone") || "").trim() || null,
        email: String(form.get("email") || "").trim() || null,
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage("Cliente atualizado.");
    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="inline-editor">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar edição" : "Editar cliente"}
      </button>

      {open && (
        <form className="workspace-form inline-editor-form" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label>
              Nome
              <input name="name" defaultValue={client.name} />
            </label>
            <label>
              Telefone
              <input name="phone" defaultValue={client.phone || ""} />
            </label>
            <label>
              E-mail
              <input name="email" type="email" defaultValue={client.email || ""} />
            </label>
            <label className="form-span-2">
              Observações
              <textarea name="notes" rows={3} defaultValue={client.notes || ""} />
            </label>
          </div>
          {message && <div className="form-message">{message}</div>}
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar alterações"}
          </button>
        </form>
      )}
    </div>
  );
}
