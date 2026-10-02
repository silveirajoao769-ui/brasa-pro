import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSubscription, isActivePro } from "@/lib/subscription";
import {
  calculateBarbecuePlan,
  CUT_CATALOG,
  STYLE_PRESETS,
  PlannerStyle,
} from "@/lib/planner";

type AIItem = {
  category: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  estimatedPrice: number;
};

type AIPlan = {
  title: string;
  adults: number;
  children: number;
  durationHours: number;
  budget: number;
  style: "economic" | "balanced" | "premium" | "custom";
  summary: string;
  tips: string[];
  estimate: number;
  items: AIItem[];
  engine: "openai" | "rules";
};

type AIIntent = {
  title: string;
  adults: number;
  children: number;
  durationHours: number;
  budget: number;
  style: "economic" | "balanced" | "premium" | "custom";
  selectedCuts: string[];
  summary: string;
  tips: string[];
};

function normalizeMoney(raw: string) {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function styleToPlanner(style: AIIntent["style"]): PlannerStyle {
  if (style === "economic") return "economico";
  if (style === "premium") return "premium";
  if (style === "custom") return "personalizado";
  return "equilibrado";
}

function plannerToPublic(style: PlannerStyle): AIPlan["style"] {
  if (style === "economico") return "economic";
  if (style === "premium") return "premium";
  if (style === "personalizado") return "custom";
  return "balanced";
}

function buildPlanFromIntent(intent: AIIntent, engine: AIPlan["engine"]): AIPlan {
  const plannerStyle = styleToPlanner(intent.style);
  const validCutIds = new Set(CUT_CATALOG.map((cut) => cut.id));

  const selectedCuts = intent.selectedCuts
    .filter((id) => validCutIds.has(id))
    .slice(0, 8);

  const cuts =
    selectedCuts.length > 0
      ? selectedCuts
      : STYLE_PRESETS[plannerStyle === "personalizado" ? "equilibrado" : plannerStyle];

  const calculated = calculateBarbecuePlan({
    adults: Math.max(1, Math.min(500, Math.round(intent.adults))),
    children: Math.max(0, Math.min(500, Math.round(intent.children))),
    duration: Math.max(2, Math.min(12, intent.durationHours)),
    selectedCuts: cuts,
  });

  return {
    title: intent.title || "Churrasco planejado com IA Brasa",
    adults: Math.max(1, Math.min(500, Math.round(intent.adults))),
    children: Math.max(0, Math.min(500, Math.round(intent.children))),
    durationHours: Math.max(2, Math.min(12, intent.durationHours)),
    budget: Math.max(0, intent.budget || 0),
    style: plannerToPublic(
      selectedCuts.length > 0 && intent.style === "custom"
        ? "personalizado"
        : plannerStyle,
    ),
    summary: intent.summary,
    tips: intent.tips.slice(0, 6),
    estimate: calculated.estimate,
    items: calculated.items,
    engine,
  };
}

function fallbackPlan(prompt: string): AIPlan {
  const peopleMatch = prompt.match(/(\d{1,3})\s*(?:pessoas|convidados|adultos)/i);
  const childrenMatch = prompt.match(/(\d{1,3})\s*(?:crianças|criancas)/i);
  const durationMatch = prompt.match(/(\d{1,2})\s*(?:h|horas?)/i);
  const budgetMatch = prompt.match(/R\$\s*([\d.]+(?:,\d{1,2})?)/i);

  const totalPeople = Math.max(2, Number(peopleMatch?.[1] || 20));
  const children = Math.min(totalPeople - 1, Math.max(0, Number(childrenMatch?.[1] || 0)));
  const adults = Math.max(1, totalPeople - children);
  const durationHours = Math.min(10, Math.max(3, Number(durationMatch?.[1] || 4)));
  const budget = budgetMatch ? normalizeMoney(budgetMatch[1]) : 0;

  const lower = prompt.toLowerCase();
  let plannerStyle: PlannerStyle =
    lower.includes("premium") || lower.includes("picanha")
      ? "premium"
      : lower.includes("econôm") || lower.includes("barato") || lower.includes("economizar")
        ? "economico"
        : "equilibrado";

  const mentionedCuts = CUT_CATALOG.filter((cut) =>
    lower.includes(cut.name.toLowerCase()),
  ).map((cut) => cut.id);

  if (mentionedCuts.length > 0) plannerStyle = "personalizado";

  const intent: AIIntent = {
    title: "Churrasco planejado com IA Brasa",
    adults,
    children,
    durationHours,
    budget,
    style: plannerToPublic(plannerStyle),
    selectedCuts: mentionedCuts,
    summary:
      "Plano montado a partir do seu pedido com quantidades proporcionais aos convidados e ao tempo de evento.",
    tips: [
      budget > 0
        ? "Use o orçamento como referência e ajuste os cortes antes de comprar."
        : "Compare preços dos cortes antes da compra para melhorar o custo total.",
      "Compre as carnes por último para reduzir o tempo fora de refrigeração.",
      "Separe carvão e gelo antes do dia do evento para evitar compras de emergência.",
    ],
  };

  return buildPlanFromIntent(intent, "rules");
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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: "Faça login para usar a IA Brasa." },
      { status: 401 },
    );
  }

  let body: { prompt?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  }

  const prompt = String(body.prompt || "").trim();

  if (prompt.length < 10) {
    return NextResponse.json(
      { error: "Descreva seu churrasco com um pouco mais de detalhe." },
      { status: 400 },
    );
  }

  if (prompt.length > 1200) {
    return NextResponse.json(
      { error: "O pedido ficou muito longo. Use até 1.200 caracteres." },
      { status: 400 },
    );
  }

  const subscription = await getSubscription(supabase, user.id);
  const proAccess = isActivePro(subscription);
  const apiKey = process.env.OPENAI_API_KEY;

  // No Free, o usuário continua com o motor determinístico sem gerar custo de IA.
  if (!proAccess || !apiKey) {
    return NextResponse.json({ plan: fallbackPlan(prompt) });
  }

  const cutIds = CUT_CATALOG.map((cut) => cut.id);
  const catalog = CUT_CATALOG.map((cut) => ({
    id: cut.id,
    name: cut.name,
    referencePricePerKg: cut.pricePerKg,
  }));

  const schema = {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      adults: { type: "integer", minimum: 1, maximum: 500 },
      children: { type: "integer", minimum: 0, maximum: 500 },
      durationHours: { type: "number", minimum: 2, maximum: 12 },
      budget: { type: "number", minimum: 0 },
      style: {
        type: "string",
        enum: ["economic", "balanced", "premium", "custom"],
      },
      selectedCuts: {
        type: "array",
        maxItems: 8,
        items: {
          type: "string",
          enum: cutIds,
        },
      },
      summary: { type: "string" },
      tips: {
        type: "array",
        maxItems: 6,
        items: { type: "string" },
      },
    },
    required: [
      "title",
      "adults",
      "children",
      "durationHours",
      "budget",
      "style",
      "selectedCuts",
      "summary",
      "tips",
    ],
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
        max_output_tokens: 1200,
        instructions:
          "Você é a IA Brasa, assistente de churrasco do Brasil. " +
          "Sua função é interpretar o pedido do usuário e estruturar as preferências. " +
          "NÃO calcule quantidades finais nem preços finais: o motor determinístico do Brasa Pro fará isso. " +
          "Use apenas IDs de cortes presentes no catálogo. " +
          "Considere crianças separadamente quando o usuário informar. " +
          "Se o usuário disser apenas o total de pessoas, considere todos adultos salvo indicação contrária. " +
          "Respeite o orçamento como preferência, não como garantia. " +
          "As dicas devem ser curtas, práticas e sem inventar marcas ou preços.",
        input:
          "Pedido do usuário:\n" +
          prompt +
          "\n\nCatálogo permitido de cortes:\n" +
          JSON.stringify(catalog),
        text: {
          format: {
            type: "json_schema",
            name: "brasa_intent",
            strict: true,
            schema,
          },
        },
      }),
      signal: AbortSignal.timeout(25000),
    });

    if (!response.ok) {
      return NextResponse.json({ plan: fallbackPlan(prompt) });
    }

    const payload = await response.json();
    const outputText = extractResponseText(payload);

    if (!outputText) {
      return NextResponse.json({ plan: fallbackPlan(prompt) });
    }

    const intent = JSON.parse(outputText) as AIIntent;
    const plan = buildPlanFromIntent(intent, "openai");

    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ plan: fallbackPlan(prompt) });
  }
}
