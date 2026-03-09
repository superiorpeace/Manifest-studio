export type LayerType = "image" | "video" | "audio" | "text";

interface BaseLayer {
  id: string;
  type: LayerType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

export interface ImageLayer extends BaseLayer {
  type: "image";
  src: string;
  fit: "cover" | "contain" | "fill";
  borderRadius: number;
  filter: string;
}

export interface VideoLayer extends BaseLayer {
  type: "video";
  src: string;
  loop: boolean;
  muted: boolean;
  borderRadius: number;
}

export interface AudioLayer extends BaseLayer {
  type: "audio";
  src: string;
  fileName: string;
  volume: number;
}

export interface TextLayer extends BaseLayer {
  type: "text";
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string;
  fontStyle: string;
  color: string;
  textAlign: "left" | "center" | "right";
  textShadow: boolean;
  bgColor: string;
  bgOpacity: number;
  borderRadius: number;
  letterSpacing: number;
}

export type Layer = ImageLayer | VideoLayer | AudioLayer | TextLayer;

export const NICHES = [
  { id: "self-love",     label: "Self Love",      emoji: "🌸" },
  { id: "abundance",     label: "Abundance",      emoji: "✨" },
  { id: "fitness",       label: "Fitness",        emoji: "💪" },
  { id: "mindset",       label: "Mindset",        emoji: "🧠" },
  { id: "confidence",    label: "Confidence",     emoji: "👑" },
  { id: "healing",       label: "Healing",        emoji: "🌿" },
  { id: "success",       label: "Success",        emoji: "🚀" },
  { id: "gratitude",     label: "Gratitude",      emoji: "🙏" },
  { id: "soft-life",     label: "Soft Life",      emoji: "🛁" },
  { id: "boss-babe",     label: "Boss Babe",      emoji: "💼" },
  { id: "glow-up",       label: "Glow Up",        emoji: "🔥" },
  { id: "mental-health", label: "Mental Health",  emoji: "💚" },
] as const;

export const TONES = [
  { id: "empowering",   label: "Empowering"  },
  { id: "gentle",       label: "Gentle"      },
  { id: "bold",         label: "Bold & Raw"  },
  { id: "poetic",       label: "Poetic"      },
  { id: "spiritual",    label: "Spiritual"   },
  { id: "hype",         label: "Hype Girl"   },
] as const;

export const FONTS = [
  { label: "Playfair",   value: "'Playfair Display', Georgia, serif" },
  { label: "Cormorant",  value: "'Cormorant Garamond', serif" },
  { label: "Syne",       value: "'Syne', sans-serif" },
  { label: "Josefin",    value: "'Josefin Sans', sans-serif" },
  { label: "DM Mono",    value: "'DM Mono', monospace" },
  { label: "Impact",     value: "Impact, sans-serif" },
];

export const IMG_FILTERS = [
  { label: "None",     value: "none" },
  { label: "Warm",     value: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { label: "Cool",     value: "hue-rotate(20deg) saturate(0.85)" },
  { label: "Dramatic", value: "contrast(1.35) brightness(0.85)" },
  { label: "Fade",     value: "brightness(1.1) contrast(0.8) saturate(0.7)" },
  { label: "B&W",      value: "grayscale(1)" },
  { label: "Vintage",  value: "sepia(0.5) contrast(0.9) brightness(1.1)" },
  { label: "Vivid",    value: "saturate(1.9) contrast(1.1)" },
];

export const BG_PRESETS = [
  "#0a0908", "#111420", "#1a0e14", "#0d1a10",
  "#1c1520", "#f5f0e8", "#ffffff", "#0a1525",
  "linear-gradient(160deg,#0a0908,#1a0e14)",
  "linear-gradient(160deg,#0a0908,#1a1408)",
  "linear-gradient(160deg,#0a1525,#0a0908)",
  "linear-gradient(180deg,#1a0e14,#0a0908)",
];
