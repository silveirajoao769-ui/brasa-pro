"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InitialProfile = {
  business_name?: string | null;
  slug?: string | null;
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  delivery_available?: boolean | null;
  pickup_available?: boolean | null;
} | null;

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export default function PartnerProfileForm({ initial }: { initial: InitialProfile }) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial?.business_name || "");
  const [slug, setSlug] = useState(initial?.slug || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const finalSlug = slugify(slug || businessName);

    if (!businessName.trim() || finalSlug.length < 3) {
      setMessage("Informe o nome da empresa e um endereço público válido.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("partner_profiles").upsert({
      id: user.id,
      business_name: businessName.trim(),
      slug: finalSlug,
      description: String(form.get("description") || "").trim(),
      phone: String(form.get("phone") || "").trim() || null,
      email: String(form.get("email") || "").trim() || null,
      city: String(form.get("city") || "").trim() || null,
      state: String(form.get("state") || "").trim() || null,
      delivery_available: form.get("delivery") === "on",
      pickup_available: form.get("pickup") === "on",
      active: true,
    });

    if (error) {
      setMessage(error.code === "23505" ? "Esse endereço público já está em uso." : error.message);
      setLoading(false);
      return;
    }

    setSlug(finalSlug);
    setMessage("Perfil do fornecedor salvo.");
    setLoading(false);
    router.refresh();
  }

  return (
    <form className="workspace-form" onSubmit={submit}>
      <div className="workspace-form-grid">
        <label className="form-span-2">
          Nome do açougue / fornecedor
          <input
            value={businessName}
            onChange={(e) => {
              setBusinessName(e.target.value);
              if (!initial?.slug) setSlug(slugify(e.target.value));
            }}
            placeholder="Ex.: Açougue Brasa Sul"
          />
        </label>

        <label className="form-span-2">
          Endereço público
          <div className="slug-input">
            <span>/parceiros/</span>
            <input value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
          </div>
        </label>

        <label>
          Telefone
          <input name="phone" defaultValue={initial?.phone || ""} placeholder="(00) 00000-0000" />
        </label>

        <label>
          E-mail
          <input name="email" type="email" defaultValue={initial?.email || ""} />
        </label>

        <label>
          Cidade
          <input name="city" defaultValue={initial?.city || ""} />
        </label>

        <label>
          Estado
          <input name="state" maxLength={2} defaultValue={initial?.state || ""} placeholder="SC" />
        </label>

        <label className="form-span-2">
          Descrição
          <textarea name="description" rows={4} defaultValue={initial?.description || ""} placeholder="Conte sobre sua empresa, especialidades, atendimento..." />
        </label>

        <label className="check-label">
          <input name="pickup" type="checkbox" defaultChecked={initial?.pickup_available ?? true} />
          Retirada no local
        </label>

        <label className="check-label">
          <input name="delivery" type="checkbox" defaultChecked={initial?.delivery_available ?? false} />
          Entrega disponível
        </label>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide" disabled={loading} type="submit">
        {loading ? "Salvando..." : "Salvar perfil do fornecedor"}
      </button>
    </form>
  );
}
