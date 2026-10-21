"use client";
import { MACRO_DV, MACRO_META, MICRO_META, type AnalysisResult, type FoodItem, type MacroKey, type MicroKey } from "@/lib/types";

interface Props {
  result: AnalysisResult;
  onChange: (next: AnalysisResult) => void;
}

function NumInput({ value, onChange, label, wide }: { value: number; onChange: (n: number) => void; label: string; wide?: boolean }) {
  return (
    <input
      className={`num ${wide ? "num-wide" : ""}`}
      type="number"
      inputMode="decimal"
      min={0}
      step="any"
      aria-label={label}
      value={Number.isFinite(value) ? value : 0}
      onChange={(e) => onChange(Math.max(0, parseFloat(e.target.value) || 0))}
    />
  );
}

export function NutritionCard({ result, onChange }: Props) {
  const t = result.totals;
  const setTotal = (k: MacroKey, v: number) => onChange({ ...result, totals: { ...t, [k]: v } });
  const setMicro = (k: MicroKey, dv: number) => {
    const meta = MICRO_META.find((m) => m.key === k)!;
    onChange({
      ...result,
      micros: { ...result.micros, [k]: { ...result.micros[k], dv, amount: Math.round((dv / 100) * meta.dvAmount * 10) / 10 } },
    });
  };

  return (
    <section className="label chrome-frame" aria-label="Nutrition facts">
      <div className="label-inner">
        <div className="label-title">
          <h2>Nutrition Facts</h2>
          <span className="conf" title="How sure the AI is">
            <span className="conf-dot" style={{ ["--c" as string]: `${Math.round(result.confidence * 100)}%` }} />
            {Math.round(result.confidence * 100)}% sure
          </span>
        </div>
        <p className="label-sub">
          {result.foods.length} item{result.foods.length === 1 ? "" : "s"} detected · tap any number to edit
        </p>
        <div className="rule thick" />
        <div className="cal-row">
          <span>Calories</span>
          <NumInput wide label="Calories" value={t.calories} onChange={(v) => setTotal("calories", v)} />
        </div>
        <div className="rule mid" />
        <div className="dv-head">% Daily Value*</div>
        {MACRO_META.map((m) => {
          const dv = MACRO_DV[m.key];
          return (
            <div key={m.key} className={`row ${m.indent ? "indent" : ""}`}>
              <span className="row-name">
                {m.indent ? m.label : <b>{m.label}</b>}
                <span className="row-amt">
                  <NumInput label={m.label} value={t[m.key]} onChange={(v) => setTotal(m.key, v)} />
                  {m.unit}
                </span>
              </span>
              <span className="row-dv">{dv ? `${Math.round((t[m.key] / dv) * 100)}%` : ""}</span>
            </div>
          );
        })}
        <div className="rule thick" />
        <div className="micros">
          {MICRO_META.map((m) => {
            const v = result.micros[m.key];
            return (
              <div key={m.key} className="micro">
                <div className="micro-top">
                  <span>{m.label}</span>
                  <span className="micro-dv">
                    <NumInput label={`${m.label} %DV`} value={v.dv} onChange={(d) => setMicro(m.key, d)} />%
                  </span>
                </div>
                <div className="micro-bar">
                  <i style={{ width: `${Math.min(v.dv, 100)}%` }} />
                </div>
                <span className="micro-amt">
                  {v.amount} {v.unit}
                </span>
              </div>
            );
          })}
        </div>
        <p className="foot">*Estimates from a photo. Your body, your call — edit freely.</p>
      </div>
    </section>
  );
}

export function FoodBreakdown({ result, onChange }: Props) {
  const update = (i: number, patch: Partial<FoodItem>) => {
    const old = result.foods[i];
    const next = { ...old, ...patch };
    const totals = { ...result.totals };
    // Keep totals in sync with per-food edits.
    (["calories", "protein", "carbs", "fat"] as const).forEach((k) => {
      totals[k] = Math.max(0, Math.round((totals[k] + (next[k] - old[k])) * 10) / 10);
    });
    const foods = result.foods.map((f, j) => (j === i ? next : f));
    onChange({ ...result, foods, totals });
  };
  const remove = (i: number) => {
    const f = result.foods[i];
    const totals = { ...result.totals };
    (["calories", "protein", "carbs", "fat"] as const).forEach((k) => (totals[k] = Math.max(0, totals[k] - f[k])));
    onChange({ ...result, foods: result.foods.filter((_, j) => j !== i), totals });
  };

  if (!result.foods.length) return null;
  return (
    <section className="glass foods">
      <h3 className="kicker">On the plate</h3>
      <ul>
        {result.foods.map((f, i) => (
          <li key={i} className="food">
            <div className="food-main">
              <input className="food-name" value={f.name} aria-label="Food name" onChange={(e) => update(i, { name: e.target.value })} />
              <input className="food-portion" value={f.portion} aria-label="Portion" onChange={(e) => update(i, { portion: e.target.value })} />
            </div>
            <div className="food-macros">
              <label>
                <NumInput label="kcal" value={f.calories} onChange={(v) => update(i, { calories: v })} />
                <small>kcal</small>
              </label>
              <label>
                <NumInput label="protein" value={f.protein} onChange={(v) => update(i, { protein: v })} />
                <small>P</small>
              </label>
              <label>
                <NumInput label="carbs" value={f.carbs} onChange={(v) => update(i, { carbs: v })} />
                <small>C</small>
              </label>
              <label>
                <NumInput label="fat" value={f.fat} onChange={(v) => update(i, { fat: v })} />
                <small>F</small>
              </label>
              <button className="x" aria-label={`Remove ${f.name}`} onClick={() => remove(i)}>
                ×
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
