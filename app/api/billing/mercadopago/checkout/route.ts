import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !user.email) {
    return NextResponse.json({ error: "Faça login para assinar o Brasa Pro." }, { status: 401 });
  }

  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { error: "O checkout do Mercado Pago ainda não está configurado." },
      { status: 503 },
    );
  }

  const origin = request.nextUrl.origin;

  const response = await fetch("https://api.mercadopago.com/preapproval", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: "Brasa Pro - Plano Pro",
      external_reference: user.id,
      payer_email: user.email,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: 39.9,
        currency_id: "BRL",
      },
      back_url: origin + "/plano?checkout=return",
      status: "pending",
    }),
  });

  const payload = await response.json();

  if (!response.ok || !payload?.id || !payload?.init_point) {
    return NextResponse.json(
      { error: "O Mercado Pago não conseguiu criar a assinatura." },
      { status: 502 },
    );
  }

  await supabase
    .from("subscriptions")
    .update({
      provider: "mercado_pago",
      provider_subscription_id: String(payload.id),
      status: "incomplete",
    })
    .eq("user_id", user.id);

  return NextResponse.json({
    initPoint: payload.init_point,
  });
}
