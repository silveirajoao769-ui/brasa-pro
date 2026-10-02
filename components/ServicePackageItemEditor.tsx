"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function ServicePackageItemEditor({
  item,
}: {
  item: {
    id: string;
    category: string;
    name: string;
    quantity: number | string | null;
    unit: string;
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
      .from("service_package_items")
      .update({
        category: String(form.get("category") || "Geral"),
        name: String(form.get("name") || "").trim(),
        quantity: String(form.get("quantity") || "") ? Number(form.get("quantity")) : null,
        unit: String(form.get("unit") || "item"),
        notes: String(form.get("notes") || "").trim(),
      })
      .eq("id", item.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="service_package_items"
        id={item.id}
        confirmText={"Excluir " + item.name + " deste pacote?"}
      />
      {open && (
        <form className="workspace-form inline-row-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label>
              Categoria
              <input name="category" defaultValue={item.category} />
            </label>
            <label>
              Item
              <input name="name" defaultValue={item.name} />
            </label>
            <label>
              Quantidade
              <input name="quantity" type="number" min={0} step="0.01" defaultValue={item.quantity ?? ""} />
            </label>
            <label>
              Unidade
              <input name="unit" defaultValue={item.unit} />
            </label>
            <label className="form-span-2">
              Observações
              <input name="notes" defaultValue={item.notes || ""} />
            </label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar item"}
          </button>
        </form>
      )}
    </div>
  );
}
