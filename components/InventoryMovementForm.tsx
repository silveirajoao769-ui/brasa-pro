"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Item = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
};

export default function InventoryMovementForm({ items }: { items: Item[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const itemId = String(form.get("itemId") || "");
    const type = String(form.get("type") || "in");
    const quantity = Number(form.get("quantity") || 0);
    const unitCost = Number(form.get("unitCost") || 0);
    const reason = String(form.get("reason") || "").trim();

    const item = items.find((entry) => entry.id === itemId);

    if (!item || quantity <= 0) {
      setMessage("Escolha um item e informe uma quantidade válida.");
      setLoading(false);
      return;
    }

    const newQuantity =
      type === "in"
        ? item.quantity + quantity
        : type === "out"
          ? item.quantity - quantity
          : quantity;

    if (newQuantity < 0) {
      setMessage("A saída é maior que a quantidade disponível.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error: movementError } = await supabase.from("inventory_movements").insert({
      user_id: user.id,
      inventory_item_id: item.id,
      movement_type: type,
      quantity,
      unit_cost: unitCost > 0 ? unitCost : null,
      reason,
    });

    if (movementError) {
      setMessage(movementError.message);
      setLoading(false);
      return;
    }

    const updatePayload: { quantity: number; average_unit_cost?: number } = {
      quantity: newQuantity,
    };

    if (type === "in" && unitCost > 0) {
      updatePayload.average_unit_cost = unitCost;
    }

    const { error: itemError } = await supabase
      .from("inventory_items")
      .update(updatePayload)
      .eq("id", item.id)
      .eq("user_id", user.id);

    if (itemError) {
      setMessage(itemError.message);
      setLoading(false);
      return;
    }

    event.currentTarget.reset();
    setMessage("Movimentação registrada.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Item
          <select name="itemId" defaultValue="">
            <option value="">Selecione</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.quantity.toLocaleString("pt-BR")} {item.unit}
              </option>
            ))}
          </select>
        </label>

        <label>
          Tipo
          <select name="type" defaultValue="in">
            <option value="in">Entrada</option>
            <option value="out">Saída</option>
            <option value="adjustment">Ajuste para</option>
          </select>
        </label>

        <label>
          Quantidade
          <input name="quantity" type="number" min={0.001} step="0.001" />
        </label>

        <label>
          Custo unitário
          <input name="unitCost" type="number" min={0} step="0.01" />
        </label>

        <label>
          Motivo
          <input name="reason" placeholder="Compra, evento, perda..." />
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading || items.length === 0} type="submit">
        {loading ? "Registrando..." : "Registrar movimentação"}
      </button>
    </form>
  );
}
