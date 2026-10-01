"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Supplier = {
  id: string;
  name: string;
};

export default function InventoryItemForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const quantity = Number(form.get("quantity") || 0);
    const minQuantity = Number(form.get("minQuantity") || 0);
    const averageUnitCost = Number(form.get("averageUnitCost") || 0);
    const preferredSupplierId = String(form.get("preferredSupplierId") || "");

    if (!name) {
      setMessage("Informe o nome do item.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("inventory_items").insert({
      user_id: user.id,
      name,
      category: String(form.get("category") || "Outros"),
      unit: String(form.get("unit") || "un"),
      quantity: Math.max(0, quantity),
      min_quantity: Math.max(0, minQuantity),
      average_unit_cost: Math.max(0, averageUnitCost),
      preferred_supplier_id: preferredSupplierId || null,
      notes: String(form.get("notes") || "").trim(),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Item adicionado ao estoque.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Item
          <input name="name" placeholder="Ex.: Carvão 5 kg" />
        </label>

        <label>
          Categoria
          <select name="category" defaultValue="Insumos">
            <option>Carnes</option>
            <option>Bebidas</option>
            <option>Acompanhamentos</option>
            <option>Insumos</option>
            <option>Equipamentos</option>
            <option>Outros</option>
          </select>
        </label>

        <label>
          Unidade
          <select name="unit" defaultValue="un">
            <option value="un">un</option>
            <option value="kg">kg</option>
            <option value="l">litro</option>
            <option value="cx">caixa</option>
            <option value="pct">pacote</option>
          </select>
        </label>

        <label>
          Quantidade atual
          <input name="quantity" type="number" min={0} step="0.001" defaultValue={0} />
        </label>

        <label>
          Estoque mínimo
          <input name="minQuantity" type="number" min={0} step="0.001" defaultValue={0} />
        </label>

        <label>
          Custo médio / unidade
          <input name="averageUnitCost" type="number" min={0} step="0.01" defaultValue={0} />
        </label>

        <label>
          Fornecedor preferido
          <select name="preferredSupplierId" defaultValue="">
            <option value="">Nenhum</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>

        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={3} placeholder="Local de armazenamento, validade, marca..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Salvando..." : "+ Adicionar ao estoque"}
      </button>
    </form>
  );
}
