"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

type Supplier = { id: string; name: string };

export default function InventoryItemEditor({
  item,
  suppliers,
}: {
  item: {
    id: string;
    name: string;
    category: string;
    unit: string;
    quantity: number | string;
    min_quantity: number | string;
    average_unit_cost: number | string;
    preferred_supplier_id: string | null;
    notes?: string | null;
  };
  suppliers: Supplier[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const form = new FormData(event.currentTarget);
    const supabase = createClient();

    await supabase.from("inventory_items").update({
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "Outros"),
      unit: String(form.get("unit") || "un"),
      quantity: Math.max(0, Number(form.get("quantity") || 0)),
      min_quantity: Math.max(0, Number(form.get("minQuantity") || 0)),
      average_unit_cost: Math.max(0, Number(form.get("averageUnitCost") || 0)),
      preferred_supplier_id: String(form.get("supplierId") || "") || null,
      notes: String(form.get("notes") || "").trim(),
      updated_at: new Date().toISOString(),
    }).eq("id", item.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions inventory-manage-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar"}
      </button>
      <RecordDeleteButton
        table="inventory_items"
        id={item.id}
        confirmText={"Excluir " + item.name + " do estoque? O histórico de movimentações deste item também será apagado."}
      />
      {open && (
        <form className="workspace-form inline-row-editor inventory-inline-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Item</span><input name="name" defaultValue={item.name} /></label>
            <label><span>Categoria</span><input name="category" defaultValue={item.category} /></label>
            <label><span>Unidade</span><input name="unit" defaultValue={item.unit} /></label>
            <label><span>Quantidade</span><input name="quantity" type="number" min={0} step="0.001" defaultValue={Number(item.quantity)} /></label>
            <label><span>Mínimo</span><input name="minQuantity" type="number" min={0} step="0.001" defaultValue={Number(item.min_quantity)} /></label>
            <label><span>Custo médio</span><input name="averageUnitCost" type="number" min={0} step="0.01" defaultValue={Number(item.average_unit_cost)} /></label>
            <label>
              <span>Fornecedor</span>
              <select name="supplierId" defaultValue={item.preferred_supplier_id || ""}>
                <option value="">Nenhum</option>
                {suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}
              </select>
            </label>
            <label className="form-span-2"><span>Observações</span><input name="notes" defaultValue={item.notes || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar item"}
          </button>
        </form>
      )}
    </div>
  );
}
