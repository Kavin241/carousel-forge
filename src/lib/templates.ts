import type { DesignSpec } from './types';

export const MASTER_TEMPLATES: Record<string, DesignSpec> = {
  minimalist_notes: {
    vibe: "minimalist_notes",
    vibeName: "Minimalist Notes App",
    palette: {
      background: "#FAFAFA",
      primary: "#1A1A1A",
      accent: "#FF4400",
      secondary: "#666666"
    },
    typography: {
      heading: { fontFamily: "Plus Jakarta Sans", fontWeight: "700", letterSpacing: -0.02 },
      body: { fontFamily: "Plus Jakarta Sans", fontWeight: "400", letterSpacing: 0 },
      accent: { fontFamily: "Space Mono", fontWeight: "400", letterSpacing: 0.05 }
    },
    backgroundStyle: "solid",
    layoutStyle: "left_heavy",
    graphicElements: [
      { type: "horizontal_rule", position: { x: 8, y: 15, width: 25 }, color: "accent", opacity: 1, size: 1 },
      { type: "corner_tag", position: { x: 92, y: 0, width: 8 }, color: "accent", opacity: 0.8, size: 1 }
    ],
    contentAngle: "Clear, academic, highly structured notes.",
    trendNote: "iOS notes app aesthetic",
    slides: []
  },
  neon_creator: {
    vibe: "neon_creator",
    vibeName: "Neon Creator",
    palette: {
      background: "#080808",
      primary: "#FFFFFF",
      accent: "#00FFCC",
      secondary: "#A3A3A3"
    },
    typography: {
      heading: { fontFamily: "Outfit", fontWeight: "900", letterSpacing: -0.04 },
      body: { fontFamily: "Outfit", fontWeight: "400", letterSpacing: 0 },
      accent: { fontFamily: "Outfit", fontWeight: "700", letterSpacing: 0.1 }
    },
    backgroundStyle: "gradient",
    gradientConfig: { angle: 135, colorStop1: "#080808", colorStop2: "#112222" },
    layoutStyle: "centered",
    graphicElements: [
      { type: "circle_accent", position: { x: 50, y: 50, width: 60 }, color: "accent", opacity: 0.05, size: 1 },
      { type: "slash_divider", position: { x: 10, y: 20, width: 5 }, color: "accent", opacity: 1, size: 1 }
    ],
    contentAngle: "High energy, punchy, disruptive.",
    trendNote: "Cyber/Neon maximalism",
    slides: []
  },
  corporate_dark: {
    vibe: "corporate_dark",
    vibeName: "Corporate Dark",
    palette: {
      background: "#0F172A",
      primary: "#F8FAFC",
      accent: "#38BDF8",
      secondary: "#94A3B8"
    },
    typography: {
      heading: { fontFamily: "Manrope", fontWeight: "700", letterSpacing: -0.01 },
      body: { fontFamily: "Lora", fontWeight: "400", letterSpacing: 0.01 },
      accent: { fontFamily: "Manrope", fontWeight: "700", letterSpacing: 0.05 }
    },
    backgroundStyle: "solid",
    layoutStyle: "top_anchored",
    graphicElements: [
      { type: "side_bar", position: { x: 0, y: 0, width: 2 }, color: "accent", opacity: 1, size: 1 }
    ],
    contentAngle: "Professional, trustworthy, educational.",
    trendNote: "B2B SaaS / fintech aesthetic",
    slides: []
  }
};
