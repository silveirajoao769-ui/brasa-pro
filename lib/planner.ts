export type PlannerStyle = "economico" | "equilibrado" | "premium" | "personalizado";

export type CatalogCut = {
  id: string;
  name: string;
  pricePerKg: number;
  weight: number;
};

export type PlannedItem = {
  category: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  estimatedPrice: number;
};

export const CUT_CATALOG: CatalogCut[] = [
  { id: "acem", name: "Acém", pricePerKg: 34, weight: 1.2 },
  { id: "linguica", name: "Linguiça toscana", pricePerKg: 24, weight: 1 },
  { id: "sobrecoxa", name: "Sobrecoxa de frango", pricePerKg: 18, weight: 1 },
  { id: "costela_suina", name: "Costela suína", pricePerKg: 31, weight: 1 },
  { id: "fraldinha", name: "Fraldinha", pricePerKg: 49, weight: 1.1 },
  { id: "costela_bovina", name: "Costela bovina", pricePerKg: 39, weight: 1.2 },
  { id: "picanha", name: "Picanha", pricePerKg: 86, weight: 1 },
  { id: "ancho", name: "Bife ancho", pricePerKg: 76, weight: 1 },
  { id: "coracao", name: "Coração de frango", pricePerKg: 39, weight: 0.7 },
];

export const STYLE_PRESETS: Record<Exclude<PlannerStyle, "personalizado">, string[]> = {
  economico: ["acem", "linguica", "sobrecoxa", "costela_suina"],
  equilibrado: ["fraldinha", "costela_bovina", "linguica", "sobrecoxa"],
  premium: ["picanha", "ancho", "costela_bovina", "linguica", "coracao"],
};

function roundQuantity(value: number, unit: string) {
  if (unit === "kg") return Math.max(0.1, Math.round(value * 10) / 10);
  return Math.max(1, Math.ceil(value));
}

export function calculateBarbecuePlan({
  adults,
  children,
  duration,
  selectedCuts,
}: {
  adults: number;
  children: number;
  duration: number;
  selectedCuts: string[];
}) {
  const people = adults + children;
  const equivalentGuests = adults + children * 0.55;
  const durationFactor = Math.min(1.3, Math.max(0.88, 1 + (duration - 4) * 0.045));
  const totalMeat = (adults * 0.42 + children * 0.22) * durationFactor;

  const cuts = CUT_CATALOG.filter((cut) => selectedCuts.includes(cut.id));
  const effectiveCuts = cuts.length > 0 ? cuts : CUT_CATALOG.filter((cut) =>
    STYLE_PRESETS.equilibrado.includes(cut.id)
  );
  const totalWeight = effectiveCuts.reduce((sum, cut) => sum + cut.weight, 0);

  const meatItems: PlannedItem[] = effectiveCuts.map((cut) => {
    const quantity = roundQuantity(totalMeat * (cut.weight / totalWeight), "kg");
    return {
      category: "Carnes",
      name: cut.name,
      quantity,
      unit: "kg",
      unitPrice: cut.pricePerKg,
      estimatedPrice: Math.round(quantity * cut.pricePerKg * 100) / 100,
    };
  });

  const drinks = Math.ceil((adults * 2.3 + children * 1.4) * durationFactor);
  const charcoal = Math.max(4, Math.ceil(totalMeat * 0.72));
  const ice = Math.max(5, Math.ceil((adults + children * 0.6) * 0.55));
  const garlicBread = Math.max(2, Math.ceil(equivalentGuests * 0.75));
  const farofa = roundQuantity(Math.max(0.5, equivalentGuests * 0.05), "kg");
  const vinaigrette = roundQuantity(Math.max(0.6, equivalentGuests * 0.075), "kg");

  const supportItems: PlannedItem[] = [
    {
      category: "Bebidas",
      name: "Bebidas variadas",
      quantity: drinks,
      unit: "un",
      unitPrice: 4.5,
      estimatedPrice: drinks * 4.5,
    },
    {
      category: "Acompanhamentos",
      name: "Pão de alho",
      quantity: garlicBread,
      unit: "un",
      unitPrice: 3.2,
      estimatedPrice: garlicBread * 3.2,
    },
    {
      category: "Acompanhamentos",
      name: "Farofa",
      quantity: farofa,
      unit: "kg",
      unitPrice: 18,
      estimatedPrice: farofa * 18,
    },
    {
      category: "Acompanhamentos",
      name: "Vinagrete",
      quantity: vinaigrette,
      unit: "kg",
      unitPrice: 12,
      estimatedPrice: vinaigrette * 12,
    },
    {
      category: "Insumos",
      name: "Carvão",
      quantity: charcoal,
      unit: "kg",
      unitPrice: 6,
      estimatedPrice: charcoal * 6,
    },
    {
      category: "Insumos",
      name: "Gelo",
      quantity: ice,
      unit: "kg",
      unitPrice: 2.5,
      estimatedPrice: ice * 2.5,
    },
  ];

  const items = [...meatItems, ...supportItems].map((item) => ({
    ...item,
    estimatedPrice: Math.round(item.estimatedPrice * 100) / 100,
  }));

  const estimate = Math.round(items.reduce((sum, item) => sum + item.estimatedPrice, 0));

  return {
    people,
    meat: Math.round(totalMeat * 10) / 10,
    drinks,
    charcoal,
    ice,
    estimate,
    items,
  };
}
