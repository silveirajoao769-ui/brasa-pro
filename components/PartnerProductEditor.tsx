"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import RecordDeleteButton from "@/components/RecordDeleteButton";

export default function PartnerProductEditor({
  product,
}: {
  product: {
    id: string;
    name: string;
    category: string;
    unit: string;
    price: number | string;
    active: boolean;
    description?: string | null;
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

    await supabase.from("partner_products").update({
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "Carnes"),
      description: String(form.get("description") || "").trim(),
      unit: String(form.get("unit") || "kg"),
      price: Math.max(0.01, Number(form.get("price") || 0)),
      active: String(form.get("active") || "true") === "true",
      updated_at: new Date().toISOString(),
    }).eq("id", product.id);

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
        table="partner_products"
        id={product.id}
        confirmText={"Excluir " + product.name + " do catálogo? Pedidos antigos continuarão registrados."}
      />
      {open && (
        <form className="workspace-form inline-row-editor" onSubmit={submit}>
          <div className="workspace-form-grid">
            <label><span>Produto</span><input name="name" defaultValue={product.name} /></label>
            <label><span>Categoria</span><input name="category" defaultValue={product.category} /></label>
            <label><span>Unidade</span><input name="unit" defaultValue={product.unit} /></label>
            <label><span>Preço</span><input name="price" type="number" min={0.01} step="0.01" defaultValue={Number(product.price)} /></label>
            <label>
              <span>Status</span>
              <select name="active" defaultValue={String(product.active)}>
                <option value="true">Ativo</option>
                <option value="false">Pausado</option>
              </select>
            </label>
            <label className="form-span-2"><span>Descrição</span><textarea name="description" rows={2} defaultValue={product.description || ""} /></label>
          </div>
          <button className="primary-button compact" type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Salvar produto"}
          </button>
        </form>
      )}
    </div>
  );
}
