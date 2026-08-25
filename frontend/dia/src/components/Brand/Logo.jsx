// DIA brand mark, following the LiA ("Law into Action") family pattern:
// a single-color ring emblem, the product initials with a caret replacing the
// i's dot (dotless ı + ^), and an uppercase letter-spaced wordmark.
export const BRAND_BLUE = '#274F91';
export const BRAND_BLUE_DARK = '#1E3F74';
export const BRAND_FONT = "'Space Grotesk', 'DM Sans', 'Segoe UI', sans-serif";

export function DiaMark({ size = 32, color = BRAND_BLUE }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="DIA">
      <circle cx="32" cy="32" r="27.5" stroke={color} strokeWidth="4.5" fill="white" />
      <text
        x="32" y="42.5"
        textAnchor="middle"
        fontFamily={BRAND_FONT}
        fontWeight="700"
        fontSize="26"
        fill={color}
        letterSpacing="0.5"
      >
        DıA
      </text>
      {/* caret over the dotless i, like LiA's accent */}
      <path d="M28.5 21.5 L32 15.5 L35.5 21.5" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

export function DiaLogo({ size = 34, stacked = false, dark = false }) {
  const color = dark ? '#ffffff' : BRAND_BLUE;
  return (
    <span className={`inline-flex items-center ${stacked ? 'flex-col' : ''}`} style={{ gap: stacked ? 6 : 10 }}>
      <DiaMark size={size} color={color} />
      <span
        style={{
          fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
          fontWeight: 700,
          letterSpacing: '0.14em',
          color,
          fontSize: Math.round(size * 0.42),
          whiteSpace: 'nowrap'
        }}
      >
        DATA INTO ACTION
      </span>
    </span>
  );
}
