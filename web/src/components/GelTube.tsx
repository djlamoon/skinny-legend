interface Props {
  label: string;
  value: number;
  goal: number;
  unit?: string;
  tone?: "pink" | "chrome" | "lilac" | "cyan";
  big?: boolean;
}

export function GelTube({ label, value, goal, unit = "g", tone = "pink", big }: Props) {
  const pct = goal > 0 ? Math.min(value / goal, 1) : 0;
  const over = value > goal;
  return (
    <div className={`tube-wrap ${big ? "tube-big" : ""}`}>
      <div className="tube-head">
        <span className="tube-label">{label}</span>
        <span className="tube-value">
          <b>{Math.round(value)}</b>
          {unit} / {Math.round(goal)}
          {unit}
        </span>
      </div>
      <div className="tube" role="progressbar" aria-valuemin={0} aria-valuemax={goal} aria-valuenow={Math.round(value)} aria-label={label}>
        <div className={`tube-fill tone-${over ? "over" : tone}`} style={{ width: `${Math.max(pct * 100, value > 0 ? 6 : 0)}%` }} />
      </div>
    </div>
  );
}
