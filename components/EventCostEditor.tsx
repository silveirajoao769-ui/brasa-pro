"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function EventCostEditor({
  cost,
}: {
  cost: {
    id: string;
    category: string;
    description: string;
    amount: number | string;
    source_type?: string | null;
  };
}) {
  const router = useRouter();
  const locked = cost.source_type === "team_assignment";
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked) return;

    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    await supabase
      .from("event_costs")
      .update({
        category: String(form.get("category") || "Outros").trim(),
        description: String(form.get("description") || "").trim(),
        amount: Math.max(0, Number(form.get("amount") || 0)),
      })
      .eq("id", cost.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  if (locked) {
    return <small className="synced-cost-label">Sincronizado com a equipe</small>;
  }

  return (
    <div className="row-manage-actions cost-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="event_costs"
        id={cost.id}
        confirmText="Excluir este custo?"
      />
      {open && (
        <form className="workspace-form inline-row-editor cost-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Categoria</span><input name="category" defaultValue={cost.category} /></label>
            <label><span>Descrição</span><input name="description" defaultValue={cost.description} /></label>
            <label><span>Valor</span><input name="amount" type="number" min={0} step="0.01" defaultValue={Number(cost.amount)} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar custo"}
          </button>
        </form>
      )}
    </div>
  );
}
