import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type JsonRecord = Record<string, unknown>;

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return null;
}

export async function POST(request: NextRequest) {
  let body: JsonRecord;

  try {
    body = asRecord(await request.json());
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const expectedSecret = process.env.CAKTO_WEBHOOK_SECRET;
  const suppliedSecret = firstString(body.secret);

  if (!expectedSecret || !suppliedSecret || suppliedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Webhook não autorizado." }, { status: 401 });
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Servidor não configurado." }, { status: 503 });
  }

  const data = asRecord(body.data);
  const customer = asRecord(body.customer);
  const dataCustomer = asRecord(data.customer);
  const buyer = asRecord(body.buyer);
  const dataBuyer = asRecord(data.buyer);
  const product = asRecord(body.product);
  const dataProduct = asRecord(data.product);
  const offer = asRecord(body.offer);
  const dataOffer = asRecord(data.offer);
  const subscription = asRecord(body.subscription);
  const dataSubscription = asRecord(data.subscription);

  const event = firstString(
    body.event,
    body.type,
    body.event_type,
    body.name,
    data.event,
    data.type,
  )?.toLowerCase();

  const email = firstString(
    customer.email,
    dataCustomer.email,
    buyer.email,
    dataBuyer.email,
    body.email,
    data.email,
  )?.toLowerCase();

  const productId = firstString(
    product.id,
    dataProduct.id,
    body.product_id,
    data.product_id,
    offer.product_id,
    dataOffer.product_id,
  );

  const subscriptionId = firstString(
    subscription.id,
    dataSubscription.id,
    body.subscription_id,
    data.subscription_id,
  );

  const periodEnd = firstString(
    subscription.current_period_end,
    dataSubscription.current_period_end,
    subscription.currentPeriodEnd,
    dataSubscription.currentPeriodEnd,
    subscription.next_payment_date,
    dataSubscription.next_payment_date,
    subscription.nextPaymentDate,
    dataSubscription.nextPaymentDate,
    subscription.ends_at,
    dataSubscription.ends_at,
    subscription.end_date,
    dataSubscription.end_date,
    body.current_period_end,
    data.current_period_end,
  );

  const fallbackPeriodEnd = () => {
    const value = new Date();
    value.setMonth(value.getMonth() + 1);
    return value.toISOString();
  };

  if (!event) {
    return NextResponse.json({ received: true, ignored: "event_missing" });
  }

  const configuredProductId = process.env.CAKTO_PRODUCT_ID;

  if (configuredProductId && productId && productId !== configuredProductId) {
    return NextResponse.json({ received: true, ignored: "other_product" });
  }

  if (!email) {
    return NextResponse.json({ received: true, ignored: "email_missing" });
  }

  const admin = createAdminClient();

  const { data: subscriptionRow } = await admin
    .from("subscriptions")
    .select("id, user_id, plan, status, current_period_end, cancel_at_period_end")
    .eq("billing_email", email)
    .maybeSingle();

  if (!subscriptionRow) {
    return NextResponse.json({ received: true, ignored: "account_not_found" });
  }

  const activateEvents = new Set(["purchase_approved", "subscription_renewed"]);
  const immediateDeactivateEvents = new Set(["refund", "chargeback"]);

  if (activateEvents.has(event)) {
    await admin
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        provider: "cakto",
        provider_subscription_id: subscriptionId,
        provider_product_id: productId || configuredProductId || null,
        current_period_end: periodEnd || fallbackPeriodEnd(),
        cancel_at_period_end: false,
        last_provider_event: event,
      })
      .eq("id", subscriptionRow.id);

    return NextResponse.json({ received: true, applied: "pro_active" });
  }

  if (event === "subscription_canceled") {
    await admin
      .from("subscriptions")
      .update({
        plan: "pro",
        status: "active",
        provider: "cakto",
        provider_subscription_id: subscriptionId || null,
        provider_product_id: productId || configuredProductId || null,
        current_period_end: periodEnd || subscriptionRow.current_period_end || fallbackPeriodEnd(),
        cancel_at_period_end: true,
        last_provider_event: event,
      })
      .eq("id", subscriptionRow.id);

    return NextResponse.json({ received: true, applied: "pro_until_period_end" });
  }

  if (immediateDeactivateEvents.has(event)) {
    await admin
      .from("subscriptions")
      .update({
        plan: "free",
        status: "canceled",
        provider: "cakto",
        provider_subscription_id: subscriptionId || null,
        provider_product_id: productId || configuredProductId || null,
        current_period_end: new Date().toISOString(),
        cancel_at_period_end: false,
        last_provider_event: event,
      })
      .eq("id", subscriptionRow.id);

    return NextResponse.json({ received: true, applied: "free_canceled" });
  }

  await admin
    .from("subscriptions")
    .update({
      provider: "cakto",
      provider_subscription_id: subscriptionId || null,
      provider_product_id: productId || configuredProductId || null,
      last_provider_event: event,
    })
    .eq("id", subscriptionRow.id);

  return NextResponse.json({ received: true, ignored: "non_access_event" });
}
