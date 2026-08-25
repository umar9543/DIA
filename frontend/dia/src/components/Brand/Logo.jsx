// DIA brand assets — pixel-exact derivatives of the LiA ("Law into Action")
// family lockup (same ring emblem and wordmark style, L→D, LAW→DATA).
import lockupPng from '../../assets/brand/dia-lockup.png';
import lockupWhitePng from '../../assets/brand/dia-lockup-white.png';
import markPng from '../../assets/brand/dia-mark.png';

export const BRAND_BLUE = '#274F91';
export const BRAND_BLUE_DARK = '#1E3F74';
export const BRAND_FONT = "'Space Grotesk', 'DM Sans', 'Segoe UI', sans-serif";

// Ring emblem only (square, 480x480 source).
export function DiaMark({ size = 32 }) {
  return (
    <img
      src={markPng}
      width={size}
      height={size}
      alt="DIA"
      draggable="false"
      style={{ display: 'block', width: size, height: size, objectFit: 'contain' }}
    />
  );
}

// Full lockup: emblem + "DATA INTO ACTION" wordmark (1661x535 source).
// `size` is the rendered height; width follows the source aspect ratio.
export function DiaLogo({ size = 34, dark = false }) {
  return (
    <img
      src={dark ? lockupWhitePng : lockupPng}
      height={size}
      alt="DIA — Data into Action"
      draggable="false"
      style={{ display: 'block', height: size, width: 'auto' }}
    />
  );
}
