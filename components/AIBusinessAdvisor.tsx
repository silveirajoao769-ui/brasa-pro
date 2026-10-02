"use client";

import { FormEvent, useMemo, useState } from "react";

type AdvisorMode = "business" | "finance" | "event" | "package" | "quote";

type AdvisorResult = {
  title: string;
  summary: string;
  insights: string[];
  next_steps: string[];
  draft: string;
  engine: "openai" | "local";
};

const defaults: Record<AdvisorMode, string> = {
  business: "Analise meu negócio no Brasa Pro e me diga os principais pontos de atenção e as próximas ações.",
  finance: "Analise meu faturamento, custos, recebimentos, lucro e margem. Onde estou perdendo dinheiro e o que devo ajustar primeiro?",
  event: "Analise este evento e me diga se preço, custos e margem parecem coerentes. Aponte riscos e próximos passos.",
  package: "Analise meus pacotes e sugira como melhorar a oferta, composição e preço por pessoa sem destruir a margem.",
  quote: "Me ajude a estruturar uma proposta comercial clara, profissional e lucrativa com base nos dados do Brasa Pro.",
};

const modeLabels: Record<AdvisorMode, string> = {
  business: "Negócio",
  finance: "Financeiro",
  event: "Evento",
  package: "Pacotes",
  quote: "Orçamento",
};

export default function AIBusinessAdvisor({
  mode,
  eventId,
}: {
  mode: AdvisorMode;
  eventId?: string | null;
}) {
  const initial = useMemo(() => defaults[mode], [mode]);
  const [prompt, setPrompt] = useState(initial);
  const [result, setResult] = useState<AdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/ai/advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          prompt,
          eventId: eventId || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.result) {
        setMessage(data.error || "Não foi possível gerar a análise.");
        return;
      }

      setResult(data.result);
    } catch {
      setMessage("Não foi possível acessar a IA Brasa agora.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="ai-advisor-layout">
      <form className="ai-prompt-card ai-advisor-prompt" onSubmit={submit}>
        <div className="ai-prompt-heading">
          <div>
            <span className="eyebrow">✦ IA BRASA · {modeLabels[mode].toUpperCase()}</span>
            <h2>O que você quer analisar?</h2>
          </div>
          <span className="ai-live-badge">PRO</span>
        </div>

        <textarea
          maxLength={1600}
          rows={8}
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="Descreva o que você quer analisar..."
        />

        <div className="ai-confirmation-note">
          <span>✓</span>
          <p>A IA pode sugerir mudanças, mas nada é alterado na sua conta sem sua confirmação.</p>
        </div>

        <div className="ai-prompt-footer">
          <small>{prompt.length}/1600 caracteres</small>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? "Analisando seus dados..." : "Analisar com IA Brasa →"}
          </button>
        </div>

        {message && <div className="form-message">{message}</div>}
      </form>

      <section className="ai-result-card ai-advisor-result">
        {!result ? (
          <div className="ai-empty-result">
            <span>✦</span>
            <h3>Sua análise aparece aqui.</h3>
            <p>
              A IA recebe somente os números e dados operacionais necessários para responder ao seu pedido.
            </p>
          </div>
        ) : (
          <>
            <div className="ai-result-heading">
              <div>
                <span className="eyebrow">ANÁLISE GERADA</span>
                <h2>{result.title}</h2>
                <p>{result.summary}</p>
              </div>
              <span className="ai-engine">
                {result.engine === "openai" ? "IA conectada" : "Leitura local"}
              </span>
            </div>

            {result.insights.length > 0 && (
              <div className="ai-advisor-block">
                <small>PRINCIPAIS INSIGHTS</small>
                <div className="ai-advisor-list">
                  {result.insights.map((item, index) => (
                    <p key={index}><span>{String(index + 1).padStart(2, "0")}</span>{item}</p>
                  ))}
                </div>
              </div>
            )}

            {result.next_steps.length > 0 && (
              <div className="ai-advisor-block">
                <small>PRÓXIMAS AÇÕES</small>
                <div className="ai-tips">
                  {result.next_steps.map((item, index) => (
                    <p key={index}><span>✓</span>{item}</p>
                  ))}
                </div>
              </div>
            )}

            {result.draft && (
              <div className="ai-advisor-draft">
                <small>RASCUNHO SUGERIDO</small>
                <p>{result.draft}</p>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
