/**
 * "Skinny Legend" wordmark: liquid-chrome script with a glossy hot-pink rim,
 * dark bevel, specular highlights and 4-point sparkles. Pure SVG, no images.
 */
const LINES = [
  { text: "Skinny", x: "45%", y: 150 },
  { text: "Legend", x: "56%", y: 292 },
];

function Words(props: React.SVGProps<SVGTextElement>) {
  return (
    <>
      {LINES.map((l) => (
        <text key={l.text} x={l.x} y={l.y} textAnchor="middle" fontSize={150} {...props}>
          {l.text}
        </text>
      ))}
    </>
  );
}

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  const d = `M${x} ${y - r} C${x + r * 0.12} ${y - r * 0.12} ${x + r * 0.12} ${y - r * 0.12} ${x + r} ${y} C${x + r * 0.12} ${y + r * 0.12} ${x + r * 0.12} ${y + r * 0.12} ${x} ${y + r} C${x - r * 0.12} ${y + r * 0.12} ${x - r * 0.12} ${y + r * 0.12} ${x - r} ${y} C${x - r * 0.12} ${y - r * 0.12} ${x - r * 0.12} ${y - r * 0.12} ${x} ${y - r}Z`;
  return (
    <g className="logo-spark">
      <path d={d} fill="url(#sl-pink)" stroke="url(#sl-pink)" strokeWidth={7} strokeLinejoin="round" />
      <path d={d} fill="url(#sl-chrome)" stroke="#3a0322" strokeWidth={1.5} />
    </g>
  );
}

export function ChromeLogo() {
  return (
    <svg className="logo" viewBox="0 0 720 340" role="img" aria-label="Skinny Legend">
      <defs>
        <linearGradient id="sl-chrome" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".3" stopColor="#ffffff" />
          <stop offset=".44" stopColor="#d6d2db" />
          <stop offset=".5" stopColor="#9e98a6" />
          <stop offset=".505" stopColor="#17131b" />
          <stop offset=".6" stopColor="#2c2731" />
          <stop offset=".7" stopColor="#7d7685" />
          <stop offset=".82" stopColor="#e9e6ee" />
          <stop offset=".93" stopColor="#ffffff" />
          <stop offset="1" stopColor="#ffc6e3" />
        </linearGradient>
        <linearGradient id="sl-pink" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffa6d5" />
          <stop offset=".3" stopColor="#ff2e97" />
          <stop offset=".62" stopColor="#b8005f" />
          <stop offset=".86" stopColor="#ff3fa0" />
          <stop offset="1" stopColor="#ffa3d3" />
        </linearGradient>
        <linearGradient id="sl-bevel" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset=".5" stopColor="#6b6470" />
          <stop offset="1" stopColor="#e8e4ec" />
        </linearGradient>
        <filter id="sl-liquid" x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.02" numOctaves={2} seed={11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={16} xChannelSelector="R" yChannelSelector="G" result="d" />
          <feComposite in="d" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="sl-spec" x="-5%" y="-10%" width="110%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={2.6} result="b" />
          <feSpecularLighting in="b" surfaceScale={5} specularConstant={0.9} specularExponent={38} lightingColor="#ffffff" result="s">
            <feDistantLight azimuth={240} elevation={58} />
          </feSpecularLighting>
          <feComponentTransfer in="s" result="t">
            <feFuncA type="linear" slope={2.2} intercept={-0.9} />
          </feComponentTransfer>
          <feComposite in="t" in2="SourceAlpha" operator="in" />
        </filter>
        <filter id="sl-gloss" x="-5%" y="-10%" width="110%" height="120%">
          <feGaussianBlur in="SourceAlpha" stdDeviation={4} result="b" />
          <feSpecularLighting in="b" surfaceScale={6} specularConstant={1.2} specularExponent={30} lightingColor="#ffffff" result="s">
            <feDistantLight azimuth={235} elevation={50} />
          </feSpecularLighting>
          <feComponentTransfer in="s" result="t">
            <feFuncA type="linear" slope={2} intercept={-0.7} />
          </feComponentTransfer>
          <feComposite in="t" in2="SourceAlpha" operator="in" result="sp" />
          <feComposite in="SourceGraphic" in2="sp" operator="arithmetic" k2={1} k3={0.8} />
        </filter>
        <filter id="sl-shadow" x="-10%" y="-20%" width="120%" height="150%">
          <feGaussianBlur stdDeviation={9} />
        </filter>
      </defs>
      <g className="logo-words" strokeLinejoin="round" strokeLinecap="round">
        {/* soft drop shadow + pink glow */}
        <g transform="translate(0 14)" opacity={0.8} filter="url(#sl-shadow)">
          <Words fill="#000" stroke="#000" strokeWidth={30} />
        </g>
        {/* pink extrusion (depth) */}
        <g transform="translate(0 7)">
          <Words fill="#6e0035" stroke="#6e0035" strokeWidth={26} />
        </g>
        {/* glossy pink rim */}
        <g filter="url(#sl-gloss)">
          <Words fill="url(#sl-pink)" stroke="url(#sl-pink)" strokeWidth={26} />
        </g>
        {/* dark bevel edge + silver bevel */}
        <Words fill="none" stroke="#2a0219" strokeWidth={13} />
        <Words fill="none" stroke="url(#sl-bevel)" strokeWidth={7} />
        {/* liquid chrome body */}
        <g filter="url(#sl-liquid)">
          <Words fill="url(#sl-chrome)" />
        </g>
        {/* specular highlights */}
        <g filter="url(#sl-spec)" style={{ mixBlendMode: "screen" }}>
          <Words fill="#ffffff" />
        </g>
      </g>
      <Sparkle x={618} y={70} r={30} />
      <Sparkle x={112} y={250} r={22} />
      <Sparkle x={660} y={210} r={12} />
    </svg>
  );
}
