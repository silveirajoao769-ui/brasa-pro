import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActivePro } from "@/lib/subscription";

type AdvisorMode = "business" | "finance" | "event" | "package" | "quote";

type AdvisorResult = {
  title: string;
  summary: string;
  insights: string[];
  next_steps: string[];
  draft: string;
  engine: "openai" | "local";
};

function money(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 2,
  }).format(value);
}

function extractResponseText(payload: unknown) {
  if (!payload || typeof payload !== "object") return "";

  const data = payload as {
    output_text?: string;
    output?: Array<{
      content?: Array<{ type?: string; text?: string }>;
    }>;
  };

  if (typeof data.output_text === "string") return data.output_text;

  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.type === "output_text" && typeof content.text === "string") {
        return content.text;
      }
    }
  }

  return "";
}

function localFallback(
  mode: AdvisorMode,
  context: Record<string, unknown>,
): AdvisorResult {
  const finance = (context.finance || {}) as {
    revenue?: number;
    costs?: number;
    profit?: number;
    margin?: number;
    received?: number;
  };

  const insights: string[] = [];
  const nextSteps: string[] = [];

  if (typeof finance.revenue === "number") {
    insights.push("Receita contratada: " + money(finance.revenue) + ".");
  }
  if (typeof finance.costs === "number") {
    insights.push("Custos lançados: " + money(finance.costs) + ".");
  }
  if (typeof finance.profit === "number") {
    insights.push("Lucro projetado: " + money(finance.profit) + ".");
  }
  if (typeof finance.margin === "number") {
    insights.push("Margem atual aproximada: " + finance.margin.toFixed(1) + "%.");
  }

  nextSteps.push("Revise os maiores custos antes de reduzir preço.");
  nextSteps.push("Confirme convidados, escopo e prazo antes de enviar uma proposta.");
  nextSteps.push("Nenhuma alteração foi aplicada automaticamente.");

  return {
    title:
      mode === "finance"
        ? "Leitura financeira do Brasa Pro"
        : mode === "package"
          ? "Sugestão para seus pacotes"
          : mode === "quote"
            ? "Apoio para proposta"
            : mode === "event"
              ? "Análise do evento"
              : "Análise do negócio",
    summary:
      "A IA externa não respondeu agora. O Brasa Pro manteve uma leitura local dos dados sem alterar sua conta.",
    insights: insights.slice(0, 6),
    next_steps: nextSteps,
    draft: "",
    engine: "local",
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Faça login para usar a IA Brasa." }, { status: 401 });
  }

  const subscription = await getSubscription(supabase, user.id);
  if (!isActivePro(subscription)) {
    return NextResponse.json(
      { error: "A análise profissional da IA Brasa faz parte do plano Pro." },
      { status: 403 },
    );
  }

  let body: { prompt?: string; mode?: AdvisorMode; eventId?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const prompt = String(body.prompt || "").trim();
  const mode: AdvisorMode = ["business", "finance", "event", "package", "quote"].includes(String(body.mode))
    ? (body.mode as AdvisorMode)
    : "business";
  const eventId = String(body.eventId || "").trim();

  if (prompt.length < 5 || prompt.length > 1600) {
    return NextResponse.json(
      { error: "Escreva um pedido entre 5 e 1.600 caracteres." },
      { status: 400 },
    );
  }

  const [
    { data: events },
    { data: costs },
    { data: quotes },
    { data: payments },
    { data: packages },
  ] = await Promise.all([
    supabase
      .from("events")
      .select("id, title, event_date, guests, revenue, status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("event_costs")
      .select("event_id, category, amount")
      .eq("user_id", user.id),
    supabase
      .from("quotes")
      .select("event_id, status, price_total, margin_percent, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("event_payments")
      .select("event_id, amount, status")
      .eq("user_id", user.id),
    supabase
      .from("service_packages")
      .select("id, name, price_per_person, min_guests, active")
      .eq("user_id", user.id)
      .order("price_per_person", { ascending: true }),
  ]);

  const eventRows = events || [];
  const costRows = costs || [];
  const quoteRows = quotes || [];
  const paymentRows = payments || [];
  const packageRows = packages || [];

  const revenue = eventRows
    .filter((event) => ["approved", "scheduled", "completed"].includes(event.status))
    .reduce((sum, event) => sum + Number(event.revenue || 0), 0);

  const totalCosts = costRows.reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
  const profit = revenue - totalCosts;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  const received = paymentRows
    .filter((payment) => payment.status === "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

  const approvedQuotes = quoteRows.filter((quote) => quote.status === "approved").length;
  const rejectedQuotes = quoteRows.filter((quote) => quote.status === "rejected").length;
  const decidedQuotes = approvedQuotes + rejectedQuotes;

  const costByCategory = new Map<string, number>();
  for (const cost of costRows) {
    const category = cost.category || "Outros";
    costByCategory.set(category, (costByCategory.get(category) || 0) + Number(cost.amount || 0));
  }

  const selectedEvent = eventId
    ? eventRows.find((event) => event.id === eventId) || null
    : null;

  const selectedEventCosts = selectedEvent
    ? costRows
        .filter((cost) => cost.event_id === selectedEvent.id)
        .map((cost) => ({
          category: cost.category,
          amount: Number(cost.amount || 0),
        }))
    : [];

  const context = {
    mode,
    finance: {
      revenue,
      costs: totalCosts,
      profit,
      margin,
      received,
      receivable: Math.max(0, revenue - received),
    },
    commercial: {
      events_total: eventRows.length,
      quotes_total: quoteRows.length,
      quotes_approved: approvedQuotes,
      quotes_rejected: rejectedQuotes,
      quote_conversion_percent:
        decidedQuotes > 0 ? (approvedQuotes / decidedQuotes) * 100 : 0,
    },
    cost_categories: [...costByCategory.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8),
    packages: packageRows.slice(0, 12).map((item) => ({
      name: item.name,
      price_per_person: Number(item.price_per_person || 0),
      min_guests: Number(item.min_guests || 1),
      active: item.active,
    })),
    selected_event: selectedEvent
      ? {
          title: selectedEvent.title,
          guests: selectedEvent.guests,
          revenue: Number(selectedEvent.revenue || 0),
          status: selectedEvent.status,
          event_date: selectedEvent.event_date,
          costs: selectedEventCosts,
        }
      : null,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ result: localFallback(mode, context) });
  }

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      insights: {
        type: "array",
        maxItems: 6,
        items: { type: "string" },
      },
      next_steps: {
        type: "array",
        maxItems: 5,
        items: { type: "string" },
      },
      draft: { type: "string" },
    },
    required: ["title", "summary", "insights", "next_steps", "draft"],
  };

  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-6-luna",
        store: false,
        max_output_tokens: 1600,
        instructions:
          "Você é a IA Brasa, copiloto de gestão para profissionais de churrasco no Brasil. " +
          "Analise somente os dados fornecidos. Não invente clientes, pagamentos, preços ou resultados. " +
          "Diferencie dado existente de sugestão. Não execute mudanças na conta. " +
          "Quando sugerir preço ou margem, explique que é uma recomendação e que o usuário precisa confirmar antes de aplicar. " +
          "Se o modo for package, ajude a estruturar cardápio/pacote. " +
          "Se for quote, ajude a redigir proposta e precificação. " +
          "Se for finance, priorize margem, recebimentos, custos e caixa. " +
          "Se for event, foque no evento selecionado. Responda em português do Brasil.",
        input:
          "Modo: " +
          mode +
          "\nPedido do usuário: " +
          prompt +
          "\n\nContexto numérico do Brasa Pro (sem dados pessoais):\n" +
          JSON.stringify(context),
        text: {
          format: {
            type: "json_schema",
            name: "brasa_business_advice",
            strict: true,
            schema,
          },
        },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return NextResponse.json({ result: localFallback(mode, context) });
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      return NextResponse.json({ result: localFallback(mode, context) });
    }

    const parsed = JSON.parse(outputText) as Omit<AdvisorResult, "engine">;

    return NextResponse.json({
      result: {
        ...parsed,
        engine: "openai",
      } satisfies AdvisorResult,
    });
  } catch {
    return NextResponse.json({ result: localFallback(mode, context) });
  }
}
