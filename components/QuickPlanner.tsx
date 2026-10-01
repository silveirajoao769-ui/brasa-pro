"use client";

import { useMemo, useState } from "react";

type Plan = {
  meat: number;
  drinks: number;
  charcoal: number;
  ice: number;
  estimate: number;
};

export default function QuickPlanner() {
  const [people, setPeople] = useState(25);
  const [budget, setBudget] = useState(900);
  const [style, setStyle] = useState("equilibrado");

  const plan = useMemo<Plan>(() => {
    const factor = style === "economico" ? 0.86 : style === "premium" ? 1.22 : 1;
    const meat = people * 0.4;
    const drinks = people * 2.2;
    const charcoal = Math.max(4, Math.ceil(meat * 0.65));
    const ice = Math.max(5, Math.ceil(people * 0.55));
    const estimate = Math.round(people * 33.5 * factor);
    return { meat, drinks, charcoal, ice, estimate };
  }, [people, style]);

  const diff = budget - plan.estimate;

  return (
    <div className="planner-card">
      <div className="planner-copy">
        <span className="eyebrow">🔥 PLANEJAMENTO INTELIGENTE</span>
        <h3>Monte seu churrasco em segundos</h3>
        <p>
          Informe o tamanho do evento e o estilo. O Brasa Pro calcula uma primeira
          estimativa instantaneamente.
        </p>
      </div>

      <div className="planner-form">
        <label>
          Quantas pessoas?
          <input
            min={2}
            max={500}
            type="number"
            value={people}
            onChange={(e) => setPeople(Math.max(2, Number(e.target.value) || 2))}
          />
        </label>

        <label>
          Orçamento disponível
          <div className="money-input">
            <span>R$</span>
            <input
              min={0}
              type="number"
              value={budget}
              onChange={(e) => setBudget(Math.max(0, Number(e.target.value) || 0))}
            />
          </div>
        </label>

        <label>
          Estilo
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            <option value="economico">Econômico</option>
            <option value="equilibrado">Equilibrado</option>
            <option value="premium">Premium</option>
          </select>
        </label>
      </div>

      <div className="plan-results">
        <div><strong>{plan.meat.toFixed(1)} kg</strong><span>Carnes</span></div>
        <div><strong>{Math.ceil(plan.drinks)}</strong><span>Bebidas</span></div>
        <div><strong>{plan.charcoal} kg</strong><span>Carvão</span></div>
        <div><strong>{plan.ice} kg</strong><span>Gelo</span></div>
        <div className="result-total">
          <strong>R$ {plan.estimate.toLocaleString("pt-BR")}</strong>
          <span>Custo estimado</span>
        </div>
      </div>

      <div className={diff >= 0 ? "budget-ok" : "budget-alert"}>
        {diff >= 0
          ? "Dentro do orçamento — sobra estimada de R$ " + diff.toLocaleString("pt-BR") + "."
          : "Acima do orçamento em R$ " + Math.abs(diff).toLocaleString("pt-BR") + "."}
      </div>

      <button className="primary-button" type="button">
        Gerar planejamento completo com IA →
      </button>
      <small className="prototype-note">
        Calculadora inicial do MVP. As regras de custo serão refinadas com preços e fornecedores.
      </small>
    </div>
  );
}
