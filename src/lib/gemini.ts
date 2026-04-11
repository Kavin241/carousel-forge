import type { DesignSpec, DesignSystemPayload } from "./types";

// In the Canva app, the API key needs to be embedded at build time
// via webpack's DefinePlugin, or passed at runtime.
// For now, we'll use a hardcoded key that gets replaced by webpack DefinePlugin.
declare const process: { env: { GEMINI_API_KEY?: string } };

const GEMINI_API_KEY = (() => {
  try {
    return process.env.GEMINI_API_KEY || "";
  } catch {
    return "";
  }
})();

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set VITE_GEMINI_API_KEY in your .env.local file and rebuild."
    );
  }

  const model = "gemini-2.5-flash";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!response.ok) {
    let errMsg = response.statusText;
    try {
      const err = await response.json();
      errMsg = err.error?.message || errMsg;
    } catch {
      // Use statusText
    }
    throw new Error(`Gemini API Error: ${errMsg}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!raw) throw new Error("Empty result from Gemini");
  return raw;
}

export async function parseDesignPayload(raw: string): Promise<DesignSystemPayload> {
  // Strip any accidental markdown fences
  let cleaned = raw
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  // Fix literal newlines inside JSON string values
  cleaned = cleaned.replace(/"([^"]*)"/g, (_match, content) => {
    return '"' + content.replace(/\n/g, "\\n").replace(/\r/g, "") + '"';
  });

  // Fix common Gemini JSON issues:
  // 1. Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, "$1");
  // 2. Remove single-line comments
  cleaned = cleaned.replace(/\/\/[^\n]*/g, "");

  try {
    const payload = JSON.parse(cleaned) as DesignSystemPayload;
    return validatePayload(payload);
  } catch (firstError) {
    // Second attempt: more aggressive cleanup
    try {
      const aggressive = cleaned
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, "$1");
      const payload = JSON.parse(aggressive) as DesignSystemPayload;
      return validatePayload(payload);
    } catch {
      console.error("Final JSON Parse Failure. Raw:", raw);
      throw new Error(`Failed to parse Gemini response as JSON: ${firstError}`);
    }
  }
}

function validatePayload(payload: DesignSystemPayload): DesignSystemPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload is not an object");
  }
  if (!payload.activeDesign) {
    throw new Error("Missing activeDesign in payload");
  }
  
  payload.activeDesign = validateSpec(payload.activeDesign);

  if (!payload.shuffleBanks) {
    payload.shuffleBanks = { palettes: [], typographies: [] };
  }
  if (!Array.isArray(payload.shuffleBanks.palettes)) {
    payload.shuffleBanks.palettes = [];
  }
  if (!Array.isArray(payload.shuffleBanks.typographies)) {
    payload.shuffleBanks.typographies = [];
  }

  // Basic cleanup for palettes
  for (const p of payload.shuffleBanks.palettes) {
    for (const key of ["background", "primary", "accent", "secondary"] as const) {
      if (p[key] && !p[key].startsWith("#")) {
        p[key] = "#" + p[key];
      }
    }
  }

  return payload;
}

/**
 * Validate and normalize a DesignSpec to prevent runtime errors.
 */
function validateSpec(spec: DesignSpec): DesignSpec {
  // Ensure slides array exists
  if (!Array.isArray(spec.slides)) {
    throw new Error("DesignSpec is missing slides array");
  }

  // Ensure palette exists and all colors are valid hex
  if (!spec.palette) {
    throw new Error("DesignSpec is missing palette");
  }

  for (const key of ["background", "primary", "accent", "secondary"] as const) {
    const color = spec.palette[key];
    if (!color || typeof color !== "string") {
      throw new Error(`palette.${key} is missing or invalid`);
    }
    // Normalize rgba() values to hex (Canva only accepts hex)
    if (color.startsWith("rgba") || color.startsWith("rgb")) {
      spec.palette[key] = rgbToHex(color);
    }
    // Ensure hex has # prefix
    if (!spec.palette[key].startsWith("#")) {
      spec.palette[key] = "#" + spec.palette[key];
    }
  }

  // Ensure each slide has required layout properties
  for (const slide of spec.slides) {
    if (!slide.layout) {
      slide.layout = {
        headingPosition: { x: 8, y: 30, width: 84 },
        bodyPosition: { x: 8, y: 62, width: 84 },
        labelPosition: { x: 8, y: 20, width: 50 },
        headingFontSize: 64,
        bodyFontSize: 24,
        textAlign: "left",
      };
    }
    if (!slide.layout.headingPosition) {
      slide.layout.headingPosition = { x: 8, y: 30, width: 84 };
    }
    // Clamp font sizes. The prompt constrains AI output to 54-86 (heading) and 22-38 (body),
    // so 100 is a safe validation ceiling. canvasWriter then multiplies by scale and clamps to 400.
    slide.layout.headingFontSize = Math.max(
      1,
      Math.min(100, slide.layout.headingFontSize || 64)
    );
    slide.layout.bodyFontSize = Math.max(
      1,
      Math.min(100, slide.layout.bodyFontSize || 24)
    );
  }

  // Ensure graphicElements is an array
  if (!Array.isArray(spec.graphicElements)) {
    spec.graphicElements = [];
  }

  return spec;
}

/**
 * Convert rgba() or rgb() string to hex.
 */
function rgbToHex(rgb: string): string {
  const match = rgb.match(/\d+/g);
  if (!match || match.length < 3) return "#888888";
  const [r, g, b] = match.map(Number);
  const toHex = (c: number) => {
    const hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
