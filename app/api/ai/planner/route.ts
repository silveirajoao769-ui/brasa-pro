import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
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

function normalizeMoney(raw: string) {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
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
  let style: PlannerStyle =
    lower.includes("premium") || lower.includes("picanha")
      ? "premium"
      : lower.includes("econôm") || lower.includes("barato") || lower.includes("economizar")
        ? "economico"
        : "equilibrado";

  const mentionedCuts = CUT_CATALOG.filter((cut) =>
    lower.includes(cut.name.toLowerCase()),
  ).map((cut) => cut.id);

  const selectedCuts = mentionedCuts.length > 0 ? mentionedCuts : STYLE_PRESETS[style];

  if (mentionedCuts.length > 0) style = "personalizado";

  const calculated = calculateBarbecuePlan({
    adults,
    children,
    duration: durationHours,
    selectedCuts,
  });

  const diff = budget > 0 ? budget - calculated.estimate : null;
  const tips = [
    "Compre as carnes por último para reduzir o tempo fora de refrigeração.",
    "Separe carvão e gelo antes do dia do evento para evitar compras de emergência.",
  ];

  if (diff != null && diff < 0) {
    tips.unshift(
      "O plano ficou acima do orçamento. Trocar parte dos cortes premium por fraldinha, acém ou linguiça reduz o custo.",
    );
  } else if (diff != null) {
    tips.unshift("O plano cabe no orçamento informado com margem para pequenos ajustes.");
  }

  return {
    title: "Churrasco planejado com IA Brasa",
    adults,
    children,
    durationHours,
    budget,
    style:
      style === "economico"
        ? "economic"
        : style === "equilibrado"
          ? "balanced"
          : style === "premium"
            ? "premium"
            : "custom",
    summary:
      "Plano montado a partir do seu pedido com quantidades proporcionais aos convidados e ao tempo de evento.",
    tips,
    estimate: calculated.estimate,
    items: calculated.items,
    engine: "rules",
  };
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
    return NextResponse.json({ error: "Faça login para usar a IA Brasa." }, { status: 401 });
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

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ plan: fallbackPlan(prompt) });
  }

  const catalog = CUT_CATALOG.map((cut) => ({
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
      summary: { type: "string" },
      tips: {
        type: "array",
        items: { type: "string" },
      },
      estimate: { type: "number", minimum: 0 },
      items: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            category: { type: "string" },
            name: { type: "string" },
            quantity: { type: "number", minimum: 0 },
            unit: { type: "string" },
            unitPrice: { type: "number", minimum: 0 },
            estimatedPrice: { type: "number", minimum: 0 },
          },
          required: [
            "category",
            "name",
            "quantity",
            "unit",
            "unitPrice",
            "estimatedPrice",
          ],
        },
      },
    },
    required: [
      "title",
      "adults",
      "children",
      "durationHours",
      "budget",
      "style",
      "summary",
      "tips",
      "estimate",
      "items",
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
        model: "gpt-6-luna",
        instructions:
          "Você é a IA Brasa, especialista em planejamento prático de churrasco no Brasil. " +
          "Transforme pedidos em um plano objetivo. Respeite o orçamento sempre que possível. " +
          "Use preços como estimativas, nunca como preços garantidos. Prefira cortes do catálogo de referência. " +
          "Considere crianças com consumo menor que adultos. Inclua carnes, bebidas, acompanhamentos, carvão e gelo. " +
          "Não invente marcas. Seja conservador com quantidades para evitar desperdício sem deixar faltar.",
        input:
          "Pedido do usuário:\n" + prompt +
          "\n\nCatálogo de referência de cortes e preços por kg:\n" +
          JSON.stringify(catalog),
        text: {
          format: {
            type: "json_schema",
            name: "brasa_plan",
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

    const parsed = JSON.parse(outputText) as Omit<AIPlan, "engine">;
    const plan: AIPlan = { ...parsed, engine: "openai" };

    return NextResponse.json({ plan });
  } catch {
    return NextResponse.json({ plan: fallbackPlan(prompt) });
  }
}
