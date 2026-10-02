"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ServicePackageItemForm({ packageId }: { packageId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const category = String(form.get("category") || "Geral").trim();
    const name = String(form.get("name") || "").trim();
    const quantityValue = String(form.get("quantity") || "");
    const quantity = quantityValue ? Number(quantityValue) : null;
    const unit = String(form.get("unit") || "item").trim();
    const notes = String(form.get("notes") || "").trim();

    if (!name) {
      setMessage("Informe o item incluído no pacote.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("service_package_items").insert({
      user_id: user.id,
      package_id: packageId,
      category: category || "Geral",
      name,
      quantity,
      unit: unit || "item",
      notes,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Item adicionado ao pacote.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form package-item-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label>
          Categoria
          <select name="category" defaultValue="Carnes">
            <option>Carnes</option>
            <option>Acompanhamentos</option>
            <option>Bebidas</option>
            <option>Equipe</option>
            <option>Estrutura</option>
            <option>Sobremesa</option>
            <option>Geral</option>
          </select>
        </label>

        <label>
          Item
          <input name="name" placeholder="Ex.: Picanha e ancho" />
        </label>

        <label>
          Quantidade
          <input name="quantity" min={0} step="0.01" type="number" placeholder="Opcional" />
        </label>

        <label>
          Unidade
          <select name="unit" defaultValue="item">
            <option value="item">item</option>
            <option value="kg">kg</option>
            <option value="g">g</option>
            <option value="un">un</option>
            <option value="L">L</option>
            <option value="ml">ml</option>
            <option value="pessoa">pessoa</option>
            <option value="serviço">serviço</option>
          </select>
        </label>

        <label className="form-span-2">
          Observação
          <input name="notes" placeholder="Ex.: servido à vontade durante o evento" />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button" type="submit" disabled={loading}>
        {loading ? "Salvando..." : "+ Adicionar item"}
      </button>
    </form>
  );
}
