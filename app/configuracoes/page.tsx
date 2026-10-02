import Link from "next/link";
import { redirect } from "next/navigation";
import ProfessionalSettingsForm from "@/components/ProfessionalSettingsForm";
import { createClient } from "@/lib/supabase/server";
import { requirePro } from "@/lib/subscription";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  await requirePro(supabase, user.id, "Configurações profissionais");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name, phone, business_email, instagram, city, state, tax_id, address_line, zip_code, professional_bio, logo_url")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <main className="workspace-page settings-page">
      <div className="shell workspace-topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-flame">🔥</span>
          <span><b>Brasa <i>Pro</i></b><small>CONFIGURAÇÕES</small></span>
        </Link>
        <Link href="/dashboard" className="primary-button compact">Dashboard</Link>
      </div>

      <section className="shell workspace-content">
        <div className="workspace-heading">
          <div>
            <span className="eyebrow">SUA MARCA NO BRASA PRO</span>
            <h1>Configurações profissionais.</h1>
            <p>Defina como sua empresa aparece para clientes em propostas, contratos e documentos comerciais.</p>
          </div>
        </div>

        <ProfessionalSettingsForm
          initial={{
            full_name: profile?.full_name || null,
            business_name: profile?.business_name || null,
            phone: profile?.phone || null,
            business_email: profile?.business_email || null,
            instagram: profile?.instagram || null,
            city: profile?.city || null,
            state: profile?.state || null,
            tax_id: profile?.tax_id || null,
            address_line: profile?.address_line || null,
            zip_code: profile?.zip_code || null,
            professional_bio: profile?.professional_bio || null,
            logo_url: profile?.logo_url || null,
          }}
        />
      </section>
    </main>
  );
}
