/** Bubbly liquid-chrome "Skinny Legend" wordmark, pure SVG. */
export function ChromeLogo() {
  const line = (text: string, y: number, fill: string, size: number) => (
    <g style={{ fontFamily: "var(--font-display), 'Arial Rounded MT Bold', sans-serif", fontWeight: 700 }}>
      {/* deep outline + drop */}
      <text x="50%" y={y + 6} textAnchor="middle" fontSize={size} fill="#3a0322" stroke="#3a0322" strokeWidth="16" strokeLinejoin="round" opacity="0.55" filter="url(#sl-blur)">
        {text}
      </text>
      <text x="50%" y={y} textAnchor="middle" fontSize={size} fill="#4a0730" stroke="url(#sl-rim)" strokeWidth="14" strokeLinejoin="round">
        {text}
      </text>
      <text x="50%" y={y} textAnchor="middle" fontSize={size} fill="none" stroke="#5c0b3a" strokeWidth="5" strokeLinejoin="round">
        {text}
      </text>
      {/* chrome body */}
      <text x="50%" y={y} textAnchor="middle" fontSize={size} fill={fill}>
        {text}
      </text>
      {/* top specular gloss */}
      <text x="50%" y={y} textAnchor="middle" fontSize={size} fill="url(#sl-gloss)" style={{ mixBlendMode: "screen" }}>
        {text}
      </text>
    </g>
  );

  return (
    <svg className="logo" viewBox="0 0 640 250" role="img" aria-label="Skinny Legend">
      <defs>
        <linearGradient id="sl-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.22" stopColor="#f3eef8" />
          <stop offset="0.46" stopColor="#a69bb3" />
          <stop offset="0.52" stopColor="#3d2c4f" />
          <stop offset="0.58" stopColor="#8f7aa6" />
          <stop offset="0.78" stopColor="#f1e8ff" />
          <stop offset="0.9" stopColor="#c7f4ff" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="sl-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff4fb" />
          <stop offset="0.2" stopColor="#ffc2e4" />
          <stop offset="0.46" stopColor="#ff3ea5" />
          <stop offset="0.53" stopColor="#8a0748" />
          <stop offset="0.6" stopColor="#e5137f" />
          <stop offset="0.8" stopColor="#ff9fd6" />
          <stop offset="0.92" stopColor="#ffe0f2" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient id="sl-rim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.3" stopColor="#d9c9e6" />
          <stop offset="0.5" stopColor="#7e6a90" />
          <stop offset="0.7" stopColor="#f7eefe" />
          <stop offset="1" stopColor="#b9e9ff" />
        </linearGradient>
        <linearGradient id="sl-gloss" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.95" />
          <stop offset="0.38" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <filter id="sl-blur" x="-10%" y="-20%" width="120%" height="140%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>
      {line("Skinny", 108, "url(#sl-chrome)", 116)}
      {line("Legend", 222, "url(#sl-pink)", 116)}
      {/* glints */}
      <g className="glint" fill="#fff">
        <path d="M118 40 l4 14 l14 4 l-14 4 l-4 14 l-4 -14 l-14 -4 l14 -4z" />
        <path d="M520 150 l3 10 l10 3 l-10 3 l-3 10 l-3 -10 l-10 -3 l10 -3z" />
      </g>
    </svg>
  );
}
