"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function EventPaymentEditor({
  payment,
}: {
  payment: {
    id: string;
    kind: string;
    description: string;
    amount: number | string;
    due_date: string | null;
    status: string;
    notes: string;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    await supabase
      .from("event_payments")
      .update({
        kind: String(form.get("kind") || "installment"),
        description: String(form.get("description") || "").trim(),
        amount: Math.max(0.01, Number(form.get("amount") || 0)),
        due_date: String(form.get("dueDate") || "") || null,
        notes: String(form.get("notes") || "").trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions payment-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="event_payments"
        id={payment.id}
        confirmText="Excluir esta cobrança?"
      />
      {open && (
        <form className="workspace-form inline-row-editor receivable-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label>
              Tipo
              <select name="kind" defaultValue={payment.kind}>
                <option value="signal">Sinal</option>
                <option value="installment">Parcela</option>
                <option value="balance">Saldo final</option>
                <option value="other">Outro</option>
              </select>
            </label>
            <label>
              Valor
              <input name="amount" type="number" min={0.01} step="0.01" defaultValue={Number(payment.amount)} />
            </label>
            <label>
              Vencimento
              <input name="dueDate" type="date" defaultValue={payment.due_date || ""} />
            </label>
            <label>
              Descrição
              <input name="description" defaultValue={payment.description || ""} />
            </label>
            <label className="form-span-2">
              Observações
              <input name="notes" defaultValue={payment.notes || ""} />
            </label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar cobrança"}
          </button>
        </form>
      )}
    </div>
  );
}
