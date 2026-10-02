"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatTaxId, isValidTaxId } from "@/lib/br-tax-id";

type AccountType = "consumer" | "professional" | "supplier";

export default function OnboardingForm({
  initial,
}: {
  initial: {
    full_name: string;
    account_type: AccountType;
    phone: string;
    city: string;
    state: string;
    business_name: string;
    tax_id: string;
  };
}) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<AccountType>(initial.account_type);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [taxId, setTaxId] = useState(formatTaxId(initial.tax_id));

  const destination = useMemo(() => {
    if (accountType === "professional") return "/plano?feature=Operação%20profissional";
    if (accountType === "supplier") return "/em-breve?feature=Marketplace";
    return "/planejar";
  }, [accountType]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") || "").trim();

    if (!fullName) {
      setMessage("Informe seu nome.");
      setLoading(false);
      return;
    }

    if (accountType === "professional" && !isValidTaxId(taxId)) {
      setMessage("Informe um CPF ou CNPJ válido para concluir a conta profissional.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        account_type: accountType,
        phone: String(form.get("phone") || "").trim() || null,
        city: String(form.get("city") || "").trim() || null,
        state: String(form.get("state") || "").trim().toUpperCase() || null,
        business_name: String(form.get("businessName") || "").trim() || null,
        tax_id: accountType === "professional" ? taxId : null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      setMessage("Não foi possível concluir seu primeiro acesso.");
      setLoading(false);
      return;
    }

    router.push(destination);
    router.refresh();
  }

  return (
    <form className="onboarding-form" onSubmit={submit}>
      <section className="onboarding-choice-grid">
        <button
          type="button"
          className={accountType === "consumer" ? "onboarding-choice active" : "onboarding-choice"}
          onClick={() => setAccountType("consumer")}
        >
          <span>🔥</span>
          <b>Faço churrascos</b>
          <small>Planejamento, quantidades, compras e receitas.</small>
        </button>

        <button
          type="button"
          className={accountType === "professional" ? "onboarding-choice active" : "onboarding-choice"}
          onClick={() => setAccountType("professional")}
        >
          <span>👨‍🍳</span>
          <b>Trabalho com churrasco</b>
          <small>Clientes, eventos, propostas, equipe e lucro.</small>
        </button>

        <button
          type="button"
          className={accountType === "supplier" ? "onboarding-choice coming-soon active" : "onboarding-choice coming-soon"}
          disabled={accountType !== "supplier"}
          aria-disabled={accountType !== "supplier"}
        >
          <span>🏪</span>
          <b>Sou fornecedor</b>
          <small>Marketplace em breve</small>
        </button>
      </section>

      <section className="workspace-panel onboarding-details">
        <div className="panel-heading">
          <div>
            <small>SEUS DADOS</small>
            <h2>Prepare sua conta</h2>
          </div>
          <span className="workspace-count">1 minuto</span>
        </div>

        <div className="workspace-form-grid">
          <label>
            Seu nome
            <input name="fullName" defaultValue={initial.full_name} placeholder="Como devemos te chamar?" />
          </label>

          <label>
            Telefone
            <input name="phone" defaultValue={initial.phone} placeholder="(48) 99999-9999" />
          </label>

          {(accountType === "professional" || accountType === "supplier") && (
            <label className="form-span-2">
              Nome comercial
              <input
                name="businessName"
                defaultValue={initial.business_name}
                placeholder={accountType === "supplier" ? "Ex.: Açougue Brasa Sul" : "Ex.: Churrasco do João"}
              />
            </label>
          )}

          {accountType === "professional" && (
            <label className="form-span-2">
              CPF ou CNPJ
              <input
                name="taxId"
                inputMode="numeric"
                value={taxId}
                onChange={(event) => setTaxId(formatTaxId(event.target.value))}
                placeholder="Obrigatório para conta profissional"
              />
            </label>
          )}

          <label>
            Cidade
            <input name="city" defaultValue={initial.city} placeholder="Sua cidade" />
          </label>

          <label>
            Estado
            <input name="state" maxLength={2} defaultValue={initial.state} placeholder="SC" />
          </label>
        </div>
      </section>

      <div className="onboarding-next-card">
        <div>
          <small>PRÓXIMA ETAPA</small>
          <b>
            {accountType === "consumer"
              ? "Planejar seu primeiro churrasco"
              : accountType === "professional"
                ? "Conhecer a operação profissional"
                : "Marketplace em breve"}
          </b>
        </div>
        <span>→</span>
      </div>

      {message && <div className="form-message">{message}</div>}

      <button className="primary-button wide onboarding-submit" type="submit" disabled={loading}>
        {loading ? "Preparando sua conta..." : "Concluir primeiro acesso →"}
      </button>
    </form>
  );
}
