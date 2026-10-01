"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = {
  id: string;
  name: string;
  unit: string;
  price: number;
};

type Props = {
  partnerId: string;
  partnerName: string;
  products: Product[];
  deliveryAvailable: boolean;
  pickupAvailable: boolean;
  isLoggedIn: boolean;
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function PartnerOrderForm({
  partnerId,
  partnerName,
  products,
  deliveryAvailable,
  pickupAvailable,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    pickupAvailable ? "pickup" : "delivery",
  );
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const selected = useMemo(
    () =>
      products
        .map((product) => ({
          ...product,
          quantity: Math.max(0, Number(quantities[product.id] || 0)),
        }))
        .filter((product) => product.quantity > 0),
    [products, quantities],
  );

  const total = selected.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0,
  );

  function updateQuantity(id: string, value: number) {
    setQuantities((current) => ({
      ...current,
      [id]: Math.max(0, value),
    }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (selected.length === 0) {
      setMessage("Escolha pelo menos um produto.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const customerName = String(form.get("customerName") || "").trim();
    const customerPhone = String(form.get("customerPhone") || "").trim();
    const notes = String(form.get("notes") || "").trim();

    if (!customerName) {
      setMessage("Informe seu nome.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    let orderId: string | null = null;

    try {
      const { data: order, error: orderError } = await supabase
        .from("partner_orders")
        .insert({
          buyer_user_id: user.id,
          partner_id: partnerId,
          status: "pending",
          fulfillment_type: fulfillment,
          customer_name: customerName,
          customer_phone: customerPhone || null,
          notes,
          total: Number(total.toFixed(2)),
        })
        .select("id")
        .single();

      if (orderError || !order) {
        throw new Error(orderError?.message || "Não foi possível criar o pedido.");
      }

      orderId = order.id;

      const { error: itemError } = await supabase.from("partner_order_items").insert(
        selected.map((product) => ({
          order_id: order.id,
          product_id: product.id,
          product_name: product.name,
          quantity: product.quantity,
          unit: product.unit,
          unit_price: product.price,
          subtotal: Number((product.quantity * product.price).toFixed(2)),
        })),
      );

      if (itemError) throw itemError;

      router.push("/pedidos/" + order.id);
      router.refresh();
    } catch (error) {
      if (orderId) {
        await supabase
          .from("partner_orders")
          .delete()
          .eq("id", orderId)
          .eq("buyer_user_id", user.id)
          .eq("status", "pending");
      }

      setMessage(error instanceof Error ? error.message : "Não foi possível finalizar o pedido.");
      setLoading(false);
    }
  }

  return (
    <form className="partner-checkout" onSubmit={submit}>
      <div className="partner-checkout-heading">
        <div>
          <span className="eyebrow">MONTAR PEDIDO</span>
          <h2>Comprar de {partnerName}</h2>
        </div>
        <strong>{money(total)}</strong>
      </div>

      <div className="partner-checkout-products">
        {products.map((product) => (
          <div className="partner-checkout-row" key={product.id}>
            <div>
              <b>{product.name}</b>
              <small>{money(product.price)} / {product.unit}</small>
            </div>

            <div className="quantity-control">
              <button
                type="button"
                onClick={() => updateQuantity(product.id, (quantities[product.id] || 0) - 1)}
              >
                −
              </button>
              <input
                type="number"
                min={0}
                step={product.unit === "kg" ? 0.1 : 1}
                value={quantities[product.id] || 0}
                onChange={(e) => updateQuantity(product.id, Number(e.target.value) || 0)}
              />
              <button
                type="button"
                onClick={() => updateQuantity(product.id, (quantities[product.id] || 0) + (product.unit === "kg" ? 0.5 : 1))}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="partner-checkout-form-grid">
        <label>
          Seu nome
          <input name="customerName" placeholder="Nome para o pedido" />
        </label>

        <label>
          Telefone
          <input name="customerPhone" placeholder="(00) 00000-0000" />
        </label>

        <label className="form-span-2">
          Como receber
          <select
            value={fulfillment}
            onChange={(e) => setFulfillment(e.target.value as "pickup" | "delivery")}
          >
            {pickupAvailable && <option value="pickup">Retirada no local</option>}
            {deliveryAvailable && <option value="delivery">Entrega</option>}
          </select>
        </label>

        <label className="form-span-2">
          Observações
          <textarea name="notes" rows={3} placeholder="Horário, corte, espessura, observações..." />
        </label>
      </div>

      <div className="partner-checkout-summary">
        <span>{selected.length} produto(s) selecionado(s)</span>
        <strong>{money(total)}</strong>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading
          ? "Enviando pedido..."
          : !isLoggedIn
            ? "Entrar para fazer pedido →"
            : "Enviar pedido ao fornecedor →"}
      </button>

      <small className="prototype-note">
        O pedido é enviado ao fornecedor. Pagamento online será conectado em uma etapa posterior.
      </small>
    </form>
  );
}
