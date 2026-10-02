"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function SupplierProductEditor({
  product,
}: {
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: number | string;
    brand: string | null;
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

    await supabase.from("supplier_products").update({
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "Outros"),
      unit: String(form.get("unit") || "un"),
      price: Math.max(0.01, Number(form.get("price") || 0)),
      brand: String(form.get("brand") || "").trim() || null,
      last_checked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", product.id);

    setLoading(false);
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="row-manage-actions supplier-price-actions">
      <button className="ghost-button compact" type="button" onClick={() => setOpen(!open)}>
        {open ? "Fechar" : "Editar preço"}
      </button>
      <RecordDeleteButton
        table="supplier_products"
        id={product.id}
        confirmText={"Excluir o preço cadastrado de " + product.name + "?"}
      />
      {open && (
        <form className="workspace-form inline-row-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Produto</span><input name="name" defaultValue={product.name} /></label>
            <label><span>Categoria</span><input name="category" defaultValue={product.category} /></label>
            <label><span>Unidade</span><input name="unit" defaultValue={product.unit} /></label>
            <label><span>Preço</span><input name="price" type="number" min={0.01} step="0.01" defaultValue={Number(product.price)} /></label>
            <label><span>Marca</span><input name="brand" defaultValue={product.brand || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Atualizar preço"}
          </button>
        </form>
      )}
    </div>
  );
}
