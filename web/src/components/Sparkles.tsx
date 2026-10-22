const STARS = [
  { top: "6%", left: "8%", size: 18, delay: "0s" },
  { top: "12%", left: "86%", size: 26, delay: "1.2s" },
  { top: "34%", left: "4%", size: 12, delay: "2.1s" },
  { top: "48%", left: "93%", size: 16, delay: "0.6s" },
  { top: "70%", left: "10%", size: 22, delay: "1.7s" },
  { top: "82%", left: "80%", size: 14, delay: "2.6s" },
  { top: "22%", left: "60%", size: 10, delay: "3.1s" },
  { top: "60%", left: "45%", size: 9, delay: "0.9s" },
];

export function Sparkles() {
  return (
    <div className="sparkles" aria-hidden>
      {STARS.map((s, i) => (
        <svg key={i} className="star" style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }} viewBox="0 0 24 24">
          <path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill="url(#star-grad)" />
        </svg>
      ))}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="star-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.5" stopColor="#ffd6f0" />
            <stop offset="1" stopColor="#c9c4cf" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}
