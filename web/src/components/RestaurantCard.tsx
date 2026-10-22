import type { CSSProperties } from "react";
import type { RestaurantPick } from "@/lib/chat-types";

const miles = (m: number) => {
  const mi = m / 1609.34;
  return mi < 0.1 ? "< 0.1 mi" : `${mi.toFixed(1)} mi`;
};

interface Props {
  pick: RestaurantPick;
  rank: number;
  recsMock: boolean;
  onLog?: (pick: RestaurantPick) => void;
  logged?: boolean;
}

export function RestaurantCard({ pick, rank, recsMock, onLog, logged }: Props) {
  const o = pick.order;
  return (
    <article className="r-card">
      <div className="r-photo">
        {pick.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={pick.imageUrl} alt={pick.name} loading="lazy" />
        ) : (
          <span className="r-emoji" aria-hidden>
            {pick.emoji ?? "🍽️"}
          </span>
        )}
        <span className="r-rank">#{rank}</span>
        {pick.mock && <span className="badge small r-mock">MOCK spot</span>}
      </div>
      <div className="r-body">
        <div className="r-top">
          <h3>{pick.name}</h3>
          {pick.price && <span className="r-price">{pick.price}</span>}
        </div>
        <div className="r-meta">
          {pick.rating != null && (
            <span className="stars" style={{ "--r": `${(pick.rating / 5) * 100}%` } as CSSProperties} aria-label={`${pick.rating} out of 5 stars`}>
              ★★★★★
            </span>
          )}
          {pick.rating != null && <b>{pick.rating.toFixed(1)}</b>}
          {pick.reviewCount != null && <span>({pick.reviewCount.toLocaleString()})</span>}
          {pick.distanceMeters != null && <span className="r-dist">· {miles(pick.distanceMeters)}</span>}
        </div>
        {pick.categories.length > 0 && <p className="r-cats">{pick.categories.join(" · ")}</p>}
        {pick.address && <p className="r-addr">📍 {pick.address}</p>}

        {o && (
          <div className="r-order">
            <div className="r-order-head">
              <span className="r-order-k">The order{recsMock ? " · mock" : ""}</span>
              <span className="kcal-pill">~{o.calories} kcal</span>
            </div>
            <b className="r-item">{o.item}</b>
            <small className="r-macros">
              est. P {o.protein}g · C {o.carbs}g · F {o.fat}g
            </small>
            {o.why && <p className="r-why">{o.why}</p>}
            {o.hacks.length > 0 && (
              <ul className="hacks" aria-label="Order hacks">
                {o.hacks.map((h) => (
                  <li key={h}>✂️ {h}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="r-actions">
          <a className="chip r-yelp" href={pick.url} target="_blank" rel="noopener noreferrer">
            {pick.mock ? "Search Yelp ↗" : "View on Yelp ↗"}
          </a>
          {o && onLog && (
            <button className="chip r-log" onClick={() => onLog(pick)} disabled={logged}>
              {logged ? "Logged ✓" : "Log it 💅"}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
