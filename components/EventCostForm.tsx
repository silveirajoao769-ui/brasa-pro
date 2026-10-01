"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EventCostForm({ eventId }: { eventId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const category = String(form.get("category") || "Outros");
    const description = String(form.get("description") || "").trim();
    const amount = Number(form.get("amount") || 0);

    if (!description || amount <= 0) {
      setMessage("Informe a descrição e um valor maior que zero.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.from("event_costs").insert({
      event_id: eventId,
      category,
      description,
      amount,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Custo adicionado.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="cost-form" onSubmit={submit}>
      <label>
        Categoria
        <select name="category" defaultValue="Carnes e ingredientes">
          <option>Carnes e ingredientes</option>
          <option>Equipe</option>
          <option>Transporte</option>
          <option>Bebidas</option>
          <option>Equipamentos</option>
          <option>Outros</option>
        </select>
      </label>
      <label>
        Descrição
        <input name="description" placeholder="Ex.: Compra no açougue" />
      </label>
      <label>
        Valor
        <input name="amount" min={0.01} step="0.01" type="number" placeholder="350" />
      </label>
      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar custo"}
      </button>
      {message && <small className="cost-message">{message}</small>}
    </form>
  );
}
