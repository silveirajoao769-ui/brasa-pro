"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const trimmed = (form: FormData, name: string, length = 150) =>
  String(form.get(name) ?? "").trim().slice(0, length);

const moneyToCents = (value: string) => {
  const normalized = value.replace(",", ".");
  const amount = Number(normalized);
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) return null;
  return Math.round(amount * 100);
};

async function session() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect("/acesso");
  return { db, user };
}

export async function createCampaign(form: FormData) {
  const { db, user } = await session();
  const product_name = trimmed(form, "product_name", 120);
  const platform = trimmed(form, "platform", 70);
  const channel = trimmed(form, "channel", 70);
  const affiliate_url = trimmed(form, "affiliate_url", 2048);
  const spent_cents = moneyToCents(trimmed(form, "spend", 40));
  let validLink = false;
  try {
    const parsed = new URL(affiliate_url);
    validLink = parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch { /* invalid URL */ }
  if (!product_name || !platform || !channel || !validLink || spent_cents === null) redirect("/afiliado?status=invalid_campaign");

  const { error } = await db.from("aos_campaigns").insert({
    user_id: user.id, product_name, platform, channel, affiliate_url, spent_cents,
  });
  if (error) redirect("/afiliado?status=save_error");
  revalidatePath("/afiliado");
  redirect("/afiliado?status=campaign_created");
}

export async function recordCommission(form: FormData) {
  const { db, user } = await session();
  const campaign_id = trimmed(form, "campaign_id", 36);
  const status = trimmed(form, "status", 10) === "paid" ? "paid" : "pending";
  const amount_cents = moneyToCents(trimmed(form, "amount", 40));
  if (!campaign_id || amount_cents === null || amount_cents < 1) redirect("/afiliado?status=invalid_commission");

  const { data: campaign } = await db.from("aos_campaigns").select("id")
    .eq("id", campaign_id).eq("user_id", user.id).maybeSingle();
  if (!campaign) redirect("/afiliado?status=invalid_commission");
  const { error } = await db.from("aos_commissions").insert({
    user_id: user.id, campaign_id, amount_cents, status,
  });
  if (error) redirect("/afiliado?status=save_error");
  revalidatePath("/afiliado");
  redirect("/afiliado?status=commission_created");
}

export async function createCohort(form: FormData) {
  const { db, user } = await session();
  const name = trimmed(form, "name", 100);
  if (name.length < 3) redirect("/mentor?status=invalid_name");

  const { error } = await db.from("aos_cohorts").insert({
    mentor_id: user.id, name, invite_code: crypto.randomUUID(),
  });
  if (error) redirect("/mentor?status=save_error");

  const displayName = (typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user.email?.split("@")[0]) || "Mentor";
  await db.from("aos_profiles").upsert({
    user_id:user.id, display_name:displayName.slice(0,100), preference:"mentor"
  },{onConflict:"user_id"});

  revalidatePath("/mentor");
  redirect("/mentor?status=cohort_created");
}

export async function requestJoin(form: FormData) {
  const { db, user } = await session();
  const invite_code = trimmed(form, "invite_code", 36).toLowerCase();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(invite_code)) {
    redirect("/afiliado?status=invalid_code");
  }
  const { error } = await db.from("aos_join_requests").insert({user_id:user.id,invite_code});
  if (error?.code === "23503") redirect("/afiliado?status=invalid_code");
  if (error && error.code !== "23505") redirect("/afiliado?status=save_error");
  revalidatePath("/afiliado");
  redirect("/afiliado?status=request_received");
}

export async function approveJoin(form: FormData) {
  const { db, user } = await session();
  const requestId = trimmed(form, "request_id", 36);
  const { data: request } = await db.from("aos_join_requests")
    .select("id,user_id,invite_code").eq("id",requestId).maybeSingle();
  if (!request) redirect("/mentor?status=request_missing");

  const { data: cohort } = await db.from("aos_cohorts")
    .select("id").eq("invite_code",request.invite_code).eq("mentor_id",user.id).maybeSingle();
  if (!cohort) redirect("/mentor?status=not_authorized");

  const { error } = await db.from("aos_enrollments").insert({
    cohort_id:cohort.id, user_id:request.user_id,
  });
  if (error && error.code !== "23505") redirect("/mentor?status=save_error");
  await db.from("aos_join_requests").delete().eq("id",request.id);
  revalidatePath("/mentor");
  revalidatePath("/afiliado");
  redirect("/mentor?status=approved");
}

export async function createAssignment(form: FormData) {
  const { db, user } = await session();
  const cohort_id = trimmed(form, "cohort_id", 36);
  const student_id = trimmed(form, "student_id", 36);
  const title = trimmed(form, "title", 160);
  const description = trimmed(form, "description", 1500);
  const due = trimmed(form,"due_at",10);
  const due_at = /^\d{4}-\d{2}-\d{2}$/.test(due) ? due : null;
  if (title.length < 3 || !cohort_id || !student_id) redirect("/mentor?status=invalid_task");

  const [cohort, enrollment] = await Promise.all([
    db.from("aos_cohorts").select("id").eq("id",cohort_id).eq("mentor_id",user.id).maybeSingle(),
    db.from("aos_enrollments").select("id").eq("cohort_id",cohort_id).eq("user_id",student_id).maybeSingle()
  ]);
  if (!cohort.data || !enrollment.data) redirect("/mentor?status=not_authorized");

  const { error } = await db.from("aos_tasks").insert({
    cohort_id, student_id, mentor_id:user.id, title, description, due_at,
  });
  if (error) redirect("/mentor?status=save_error");
  revalidatePath("/mentor");
  revalidatePath("/afiliado");
  redirect("/mentor?status=task_created");
}

export async function toggleTask(form: FormData) {
  const { db, user } = await session();
  const id = trimmed(form,"task_id",36);
  const completed = trimmed(form,"completed",10) === "true";
  if (!id) redirect("/afiliado?status=invalid_task");
  const { error } = await db.from("aos_tasks").update({
    completed_at:completed ? new Date().toISOString() : null,
  }).eq("id",id).eq("student_id",user.id);
  if (error) redirect("/afiliado?status=save_error");
  revalidatePath("/afiliado");
  revalidatePath("/mentor");
  redirect("/afiliado?status=task_updated");
}
