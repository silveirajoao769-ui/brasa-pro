import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type MercadoPagoSubscription = {
  id?: string;
  status?: string;
  external_reference?: string;
  next_payment_date?: string | null;
};

export async function POST(request: NextRequest) {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;

  if (!accessToken || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ received: true });
  }

  let body: {
    type?: string;
    topic?: string;
    data?: { id?: string | number };
    id?: string | number;
  } = {};

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ received: true });
  }

  const type = body.type || body.topic || "";
  const resourceId = body.data?.id || body.id;

  if (type !== "subscription_preapproval" || !resourceId) {
    return NextResponse.json({ received: true });
  }

  const providerResponse = await fetch(
    "https://api.mercadopago.com/preapproval/" + encodeURIComponent(String(resourceId)),
    {
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
    },
  );

  if (!providerResponse.ok) {
    return NextResponse.json({ received: true });
  }

  const subscription = (await providerResponse.json()) as MercadoPagoSubscription;
  const userId = subscription.external_reference;

  if (!userId || !subscription.id) {
    return NextResponse.json({ received: true });
  }

  const providerStatus = subscription.status || "pending";
  const plan = providerStatus === "authorized" ? "pro" : "free";
  const status =
    providerStatus === "authorized"
      ? "active"
      : providerStatus === "paused"
        ? "paused"
        : providerStatus === "cancelled" || providerStatus === "canceled"
          ? "canceled"
          : "incomplete";

  const admin = createAdminClient();

  await admin
    .from("subscriptions")
    .update({
      plan,
      status,
      provider: "mercado_pago",
      provider_subscription_id: subscription.id,
      current_period_end: subscription.next_payment_date || null,
    })
    .eq("user_id", userId);

  return NextResponse.json({ received: true });
}
