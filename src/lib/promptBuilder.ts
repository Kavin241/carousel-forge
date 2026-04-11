import { CANVA_FREE_FONTS } from './styleLibrary';
import type { DesignSpec } from './types';

const FONT_LIST = CANVA_FREE_FONTS.join(', ');

const SYSTEM_CONTEXT = `
You are CarouselForge, an expert graphic designer and copywriter for educational social media material.

CRITICAL JSON RULES:
Your output must ALWAYS be pure, valid JSON. No markdown fences. No explanations.

--- THE GRAPHIC DESIGN RULEBOOK ---
You operate in a 100x100 percentage layout grid.
1. THE ALIGNMENT GRID
   - If textAlign is "left": headingPosition.x, bodyPosition.x MUST BE EXACTLY EQUAL.
   - If textAlign is "center": x MUST BE EXACTLY EQUAL to (100 - width) / 2.
2. NO-OVERLAP VERTICAL RHYTHM
   - Top-down visual hierarchy:
     * Label -> Y: 10 to 12
     * Heading -> Y MUST be at least Label Y + 10.
     * Body -> Y MUST be at least Heading Y + 30 (to allow text to wrap).
   - Keep CTAs near the bottom but above the edge (Y: 75-85).
3. WHITESPACE
   - Never let width exceed 84. Keep text constrained.
   - Never place any text element with Y < 8 or Y > 92.
4. TYPOGRAPHY
   - Heading size: 54-86. Body size: 22-38. Label: 14-18.
5. CONTENT FLOW
   - Slide count must be 6 to 8. Sequence: hook → context → points → cta.
`;

export function buildDesignPrompt(params: {
  script: string | null;
  vibePrompt: string | null;
  baseTemplate: DesignSpec | null;
}): string {
  const { script, vibePrompt, baseTemplate } = params;

  let prompt = SYSTEM_CONTEXT + '\n\n';

  // Content source
  if (script) {
    prompt += `USER SCRIPT / CONTENT:\n"${script}"\n\nInterpret this and generate 6-8 logical slides. The narrative should flow naturally.\n\n`;
  } else {
    prompt += `No script provided. Generate a compelling educational carousel on a trending topic for professionals. Make the hook impossible to scroll past.\n\n`;
  }

  // Master Template Override vs Custom Vibe
  if (baseTemplate) {
    prompt += `MASTER TEMPLATE OVERRIDE:
The user has selected a strict template preset. You MUST USE EXACTLY these design values for the activeDesign:
- Palette: ${JSON.stringify(baseTemplate.palette)}
- Typography: ${JSON.stringify(baseTemplate.typography)}
- BackgroundStyle: "${baseTemplate.backgroundStyle}"
- LayoutStyle: "${baseTemplate.layoutStyle}"
- GraphicElements: ${JSON.stringify(baseTemplate.graphicElements)}

DO NOT alter these values for the activeDesign. Your job is ONLY to generate the text content ("slides") so that it fits beautifully into these coordinates. However, you MUST still generate 5 alternate functional palettes and 3 alternate typographies in the shuffleBanks that harmonise with this template's vibe.

`;
  } else if (vibePrompt) {
    prompt += `STYLE DIRECTION:
"${vibePrompt}"
You must design a beautifully cohesive visual layout, typography system (using ONLY fonts from: ${FONT_LIST}), and color palette that matches this vibe perfectly.

`;
  } else {
    prompt += `No style direction or template given. Choose a stunning, premium aesthetic (e.g. minimalist dark mode, or vibrant brutalism).\n\n`;
  }

  // Output format
  prompt += `OUTPUT FORMAT:
Return only a single valid JSON object matching this DesignSystemPayload interface:

{
  "activeDesign": {
    "vibe": "snake_case_vibe_id",
    "vibeName": "Human Readable Name",
    "palette": { "background": "#hex", "primary": "#hex", "accent": "#hex", "secondary": "#hex" },
    "typography": {
      "heading": { "fontFamily": "Font Name", "fontWeight": "700", "letterSpacing": -0.02 },
      "body": { "fontFamily": "Font Name", "fontWeight": "400", "letterSpacing": 0 },
      "accent": { "fontFamily": "Font Name", "fontWeight": "400", "letterSpacing": 0.05 }
    },
    "backgroundStyle": "solid|gradient|noise|split",
    "gradientConfig": { "angle": 135, "colorStop1": "#hex", "colorStop2": "#hex" },
    "layoutStyle": "centered|left_heavy|asymmetric|top_anchored",
    "graphicElements": [
      { "type": "element_type", "position": { "x": 0, "y": 0, "width": 20 }, "color": "accent", "opacity": 0.8, "size": 1 }
    ],
    "slides": [
      {
        "index": 0,
        "type": "hook",
        "heading": "The heading text",
        "body": "Body text or null",
        "label": "Label text or null",
        "layout": {
          "headingPosition": { "x": 8, "y": 30, "width": 84 },
          "bodyPosition": { "x": 8, "y": 62, "width": 84 },
          "labelPosition": { "x": 8, "y": 20, "width": 50 },
          "headingFontSize": 72,
          "bodyFontSize": 24,
          "textAlign": "left"
        }
      }
    ],
    "contentAngle": "Brief description",
    "trendNote": "Current design trend"
  },
  "shuffleBanks": {
    "palettes": [
      { "background": "#hex", "primary": "#hex", "accent": "#hex", "secondary": "#hex" }
    ],
    "typographies": [
      { /* same shape as activeDesign.typography */ }
    ]
  }
}

The 'shuffleBanks.palettes' array MUST contain exactly 5 different cohesive palette options matching the vibe.
The 'shuffleBanks.typographies' array MUST contain exactly 3 different cohesive typography options matching the vibe.
DO NOT wrap the response in markdown \`\`\`json blocks.
`;

  return prompt;
}
