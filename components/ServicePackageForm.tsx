"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ServicePackageForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const description = String(form.get("description") || "").trim();
    const pricePerPerson = Number(form.get("pricePerPerson") || 0);
    const minGuests = Number(form.get("minGuests") || 1);
    const notes = String(form.get("notes") || "").trim();

    if (!name || pricePerPerson <= 0) {
      setMessage("Informe o nome e um valor por pessoa maior que zero.");
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
      .from("service_packages")
      .insert({
        user_id: user.id,
        name,
        description,
        price_per_person: pricePerPerson,
        min_guests: Math.max(1, Math.floor(minGuests)),
        notes,
        active: true,
      })
      .select("id")
      .single();

    if (error || !data) {
      setMessage(error?.message || "Não foi possível criar o pacote.");
      setLoading(false);
      return;
    }

    router.push("/pacotes/" + data.id);
    router.refresh();
  }

  return (
    <form className="workspace-form package-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Nome do pacote
          <input name="name" placeholder="Ex.: Churrasco Premium" />
        </label>

        <label>
          Preço por pessoa
          <input name="pricePerPerson" min={0.01} step="0.01" type="number" placeholder="89.90" />
        </label>

        <label>
          Mínimo de convidados
          <input name="minGuests" min={1} step={1} type="number" defaultValue={20} />
        </label>

        <label className="form-span-2">
          Descrição comercial
          <textarea
            name="description"
            rows={3}
            placeholder="Ex.: seleção premium de carnes, acompanhamentos e serviço completo."
          />
        </label>

        <label className="form-span-2">
          Observações internas
          <textarea name="notes" rows={2} placeholder="Regras, detalhes de montagem, logística..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Criando..." : "+ Criar pacote"}
      </button>
    </form>
  );
}
