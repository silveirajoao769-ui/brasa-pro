"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Supplier = {
  id: string;
  name: string;
};

export default function SupplierProductForm({ suppliers }: { suppliers: Supplier[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const supplierId = String(form.get("supplierId") || "");
    const name = String(form.get("name") || "").trim();
    const price = Number(form.get("price") || 0);

    if (!supplierId || !name || price <= 0) {
      setMessage("Escolha o fornecedor, informe o produto e um preço válido.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("supplier_products").insert({
      user_id: user.id,
      supplier_id: supplierId,
      name,
      category: String(form.get("category") || "Outros"),
      unit: String(form.get("unit") || "un"),
      price,
      brand: String(form.get("brand") || "").trim() || null,
      sku: String(form.get("sku") || "").trim() || null,
      last_checked_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Preço salvo.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Fornecedor
          <select name="supplierId" defaultValue="">
            <option value="">Selecione</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
            ))}
          </select>
        </label>

        <label className="form-span-2">
          Produto
          <input name="name" placeholder="Ex.: Picanha" />
        </label>

        <label>
          Categoria
          <select name="category" defaultValue="Carnes">
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
          <select name="unit" defaultValue="kg">
            <option value="kg">kg</option>
            <option value="un">un</option>
            <option value="l">litro</option>
            <option value="cx">caixa</option>
            <option value="pct">pacote</option>
          </select>
        </label>

        <label>
          Preço
          <input name="price" type="number" min={0.01} step="0.01" placeholder="69.90" />
        </label>

        <label>
          Marca
          <input name="brand" placeholder="Opcional" />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading || suppliers.length === 0} type="submit">
        {loading ? "Salvando..." : "Salvar preço"}
      </button>
    </form>
  );
}
