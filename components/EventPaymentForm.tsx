"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function EventPaymentForm({
  eventId,
  remaining,
}: {
  eventId: string;
  remaining: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const kind = String(form.get("kind") || "installment");
    const description = String(form.get("description") || "").trim();
    const amount = Number(form.get("amount") || 0);
    const dueDate = String(form.get("dueDate") || "");
    const notes = String(form.get("notes") || "").trim();

    if (amount <= 0) {
      setMessage("Informe um valor maior que zero.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("event_payments").insert({
      user_id: user.id,
      event_id: eventId,
      kind,
      description,
      amount,
      due_date: dueDate || null,
      notes,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Cobrança adicionada.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form receivable-form" onSubmit={submit}>
      <div className="receivable-form-hint">
        <span>Falta programar/receber</span>
        <b>{money(Math.max(0, remaining))}</b>
      </div>

      <div className="workspace-form-grid">
        <label>
          Tipo
          <select name="kind" defaultValue="signal">
            <option value="signal">Sinal</option>
            <option value="installment">Parcela</option>
            <option value="balance">Saldo final</option>
            <option value="other">Outro</option>
          </select>
        </label>

        <label>
          Valor
          <input
            name="amount"
            min={0.01}
            step="0.01"
            type="number"
            placeholder={remaining > 0 ? String(remaining.toFixed(2)) : "500.00"}
          />
        </label>

        <label>
          Vencimento
          <input name="dueDate" type="date" />
        </label>

        <label>
          Descrição
          <input name="description" placeholder="Ex.: Sinal para reservar a data" />
        </label>

        <label className="form-span-2">
          Observação
          <textarea name="notes" rows={2} placeholder="Pix, condição combinada, observações..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar cobrança"}
      </button>
    </form>
  );
}
