"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PartnerProductForm({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const price = Number(form.get("price") || 0);

    if (!name || price <= 0) {
      setMessage("Informe o produto e um preço válido.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("partner_products").insert({
      partner_id: user.id,
      name,
      category: String(form.get("category") || "Carnes"),
      description: String(form.get("description") || "").trim(),
      unit: String(form.get("unit") || "kg"),
      price,
      active: true,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Produto adicionado ao catálogo.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Produto
          <input name="name" placeholder="Ex.: Picanha Angus" />
        </label>
        <label>
          Categoria
          <select name="category" defaultValue="Carnes">
            <option>Carnes</option>
            <option>Kits</option>
            <option>Bebidas</option>
            <option>Acompanhamentos</option>
            <option>Insumos</option>
          </select>
        </label>
        <label>
          Unidade
          <select name="unit" defaultValue="kg">
            <option value="kg">kg</option>
            <option value="un">un</option>
            <option value="kit">kit</option>
            <option value="cx">caixa</option>
          </select>
        </label>
        <label>
          Preço
          <input name="price" type="number" min={0.01} step="0.01" />
        </label>
        <label className="form-span-2">
          Descrição
          <textarea name="description" rows={3} placeholder="Corte, peso médio, composição do kit..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading || !enabled} type="submit">
        {loading ? "Salvando..." : enabled ? "+ Adicionar ao catálogo" : "Salve o perfil primeiro"}
      </button>
    </form>
  );
}
