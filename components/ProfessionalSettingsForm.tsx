"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTaxId, isValidTaxId } from "@/lib/br-tax-id";

type Props = {
  initial: {
    full_name: string | null;
    business_name: string | null;
    phone: string | null;
    business_email: string | null;
    instagram: string | null;
    city: string | null;
    state: string | null;
    tax_id: string | null;
    address_line: string | null;
    zip_code: string | null;
    professional_bio: string | null;
    logo_url: string | null;
    account_type: string;
  };
};

export default function ProfessionalSettingsForm({ initial }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(initial.logo_url || "");
  const [taxId, setTaxId] = useState(formatTaxId(initial.tax_id || ""));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function uploadLogo(file: File) {
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      setMessage("Use uma imagem PNG, JPG ou WEBP.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage("A logo deve ter no máximo 2 MB.");
      return;
    }

    setUploading(true);
    setMessage("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = user.id + "/logo-" + Date.now() + "." + ext;

    const { error } = await supabase.storage
      .from("brand-assets")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type,
      });

    if (error) {
      setMessage(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("brand-assets").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
    setUploading(false);
    setMessage("Logo enviada. Salve as configurações para aplicar.");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    if (initial.account_type === "professional" && !isValidTaxId(taxId)) {
      setMessage("Informe um CPF ou CNPJ válido para a conta profissional.");
      setSaving(false);
      return;
    }

    const payload = {
      full_name: String(form.get("fullName") || "").trim() || null,
      business_name: String(form.get("businessName") || "").trim() || null,
      phone: String(form.get("phone") || "").trim() || null,
      business_email: String(form.get("businessEmail") || "").trim() || null,
      instagram: String(form.get("instagram") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
      state: String(form.get("state") || "").trim().toUpperCase() || null,
      tax_id: taxId.trim() || null,
      address_line: String(form.get("addressLine") || "").trim() || null,
      zip_code: String(form.get("zipCode") || "").trim() || null,
      professional_bio: String(form.get("professionalBio") || "").trim() || null,
      logo_url: logoUrl || null,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", user.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Configurações profissionais salvas.");
    setSaving(false);
    router.refresh();
  }

  return (
    <form className="professional-settings-form" onSubmit={submit}>
      <section className="settings-brand-card">
        <div className="settings-logo-preview">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo da empresa" />
          ) : (
            <span>🔥</span>
          )}
        </div>
        <div>
          <span className="eyebrow">IDENTIDADE VISUAL</span>
          <h2>Logo da sua marca</h2>
          <p>Ela poderá aparecer nas propostas e contratos enviados aos clientes.</p>
          <div className="settings-logo-actions">
            <input
              ref={fileRef}
              hidden
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void uploadLogo(file);
              }}
            />
            <button
              className="ghost-button"
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? "Enviando..." : "Enviar logo"}
            </button>
            {logoUrl && (
              <button className="icon-danger-button" type="button" onClick={() => setLogoUrl("")}>
                ×
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="settings-form-grid">
        <article className="workspace-panel">
          <div className="panel-heading">
            <div><small>IDENTIDADE</small><h2>Profissional e empresa</h2></div>
          </div>
          <div className="workspace-form-grid">
            <label>
              Seu nome
              <input name="fullName" defaultValue={initial.full_name || ""} placeholder="Nome completo" />
            </label>
            <label>
              Nome comercial
              <input name="businessName" defaultValue={initial.business_name || ""} placeholder="Ex.: Brasa do João" />
            </label>
            <label>
              CPF/CNPJ {initial.account_type === "professional" ? "*" : ""}
              <input
                name="taxId"
                inputMode="numeric"
                value={taxId}
                onChange={(event) => setTaxId(formatTaxId(event.target.value))}
                placeholder={initial.account_type === "professional" ? "Obrigatório para conta profissional" : "CPF ou CNPJ"}
                required={initial.account_type === "professional"}
              />
            </label>
            <label>
              Instagram
              <input name="instagram" defaultValue={initial.instagram || ""} placeholder="@seuperfil" />
            </label>
            <label>
              Telefone
              <input name="phone" defaultValue={initial.phone || ""} placeholder="(48) 99999-9999" />
            </label>
            <label>
              E-mail comercial
              <input name="businessEmail" type="email" defaultValue={initial.business_email || ""} placeholder="contato@empresa.com" />
            </label>
            <label className="form-span-2">
              Sobre o serviço
              <textarea
                name="professionalBio"
                rows={4}
                defaultValue={initial.professional_bio || ""}
                placeholder="Breve apresentação do seu serviço para propostas comerciais."
              />
            </label>
          </div>
        </article>

        <article className="workspace-panel">
          <div className="panel-heading">
            <div><small>LOCALIZAÇÃO</small><h2>Dados comerciais</h2></div>
          </div>
          <div className="workspace-form-grid">
            <label className="form-span-2">
              Endereço
              <input name="addressLine" defaultValue={initial.address_line || ""} placeholder="Rua, número, bairro" />
            </label>
            <label>
              Cidade
              <input name="city" defaultValue={initial.city || ""} placeholder="Cidade" />
            </label>
            <label>
              Estado
              <input name="state" maxLength={2} defaultValue={initial.state || ""} placeholder="SC" />
            </label>
            <label>
              CEP
              <input name="zipCode" defaultValue={initial.zip_code || ""} placeholder="00000-000" />
            </label>
          </div>
        </article>
      </div>

      {message && <div className="form-message settings-message">{message}</div>}

      <button className="primary-button settings-save-button" type="submit" disabled={saving || uploading}>
        {saving ? "Salvando..." : "Salvar configurações profissionais"}
      </button>
    </form>
  );
}
