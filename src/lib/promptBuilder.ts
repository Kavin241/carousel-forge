import { CANVA_FREE_FONTS } from './styleLibrary';
import { LockState, DesignSpec, ExtractedSlide } from './types';

const FONT_LIST = CANVA_FREE_FONTS.join(', ');

const SYSTEM_CONTEXT = `
You are CarouselForge, an expert social media carousel designer specialising in educational content for Instagram, TikTok, and LinkedIn (all 1:1 format, 1080x1080px).

You have deep knowledge of current viral carousel design trends from 2024-2025:
- Bold editorial typography with extreme size contrast
- Dark backgrounds with single neon or pastel accent
- Authentic "notes app" and "raw screenshot" aesthetics
- Layered geometric shapes as background decoration
- Clean whitespace with one dominant typographic statement per slide

Your output must ALWAYS be valid JSON matching the DesignSpec interface. No preamble, no explanation, no markdown fences. Pure JSON only.

CRITICAL RULES:
1. Fonts must ONLY come from this list: ${FONT_LIST}
2. All positions are percentages (0-100) of a 1080x1080 canvas
3. Slide count must be between 6 and 8
4. Slide types must follow this sequence: hook → point(s) → elaboration(s) → callout → cta
5. The hook slide heading must be a scroll-stopper (provocative, surprising, or bold)
6. Every slide must feel complete at a glance — no slide should require reading another slide to make sense
7. Font sizes: heading 48-96px, body 20-34px, label 14-18px
8. Leave generous padding — no text should be within 8% of any canvas edge
`;

export function buildDesignPrompt(params: {
  mode: 'build' | 'restyle';
  script: string | null;
  vibePrompt: string | null;
  existingSlides: ExtractedSlide[] | null;
  lockedElements: LockState;
  currentSpec: DesignSpec | null;
  shuffleTarget: keyof LockState | 'all' | null;
}): string {
  const { mode, script, vibePrompt, existingSlides, lockedElements, currentSpec, shuffleTarget } = params;

  let prompt = SYSTEM_CONTEXT + '\n\n';

  // --- Content source ---
  if (mode === 'restyle' && existingSlides) {
    const slideSummary = existingSlides
      .filter(s => s.include)
      .map(s => {
        const texts = s.textBlocks.map(t => `  - "${t.text}" (${t.isHeading ? 'heading' : 'body'})`).join('\n');
        return `Page ${s.pageIndex + 1}:\n${texts}`;
      }).join('\n\n');

    prompt += `MODE: RESTYLE
The user has an existing carousel with this content. Do NOT change the text. Use it exactly as provided for the slide content.

EXISTING CONTENT:
${slideSummary}

`;
  } else {
    prompt += `MODE: BUILD\n`;
    if (script) {
      prompt += `USER SCRIPT / REFERENCE:
"${script}"

Interpret this as: a full slide-by-slide script if it contains line breaks or numbered points, or a single topic reference if it is a paragraph. Generate 6-8 logical slides from it. The narrative should flow naturally: hook → context → key points → insight → call to action.

`;
    } else {
      prompt += `No script provided. Generate a compelling educational carousel on a topic that is currently trending for expat lifestyle, relocation, international living, or cultural adaptation content. Make the hook impossible to scroll past.

`;
    }
  }

  // --- Vibe / style direction ---
  if (vibePrompt) {
    prompt += `STYLE DIRECTION FROM USER:
"${vibePrompt}"
Let this guide your aesthetic choices. Interpret it liberally.

`;
  } else {
    prompt += `No style direction given. Choose the aesthetic you judge best fits the content tone.

`;
  }

  // --- Locked elements (shuffle mode) ---
  if (currentSpec && shuffleTarget && shuffleTarget !== 'all') {
    prompt += `PARTIAL SHUFFLE MODE:
The user is happy with some elements. Keep these EXACTLY as specified:

`;
    if (lockedElements.background) {
      prompt += `- Background: keep backgroundStyle "${currentSpec.backgroundStyle}", palette.background "${currentSpec.palette.background}"\n`;
      if (currentSpec.gradientConfig) prompt += `  gradientConfig: ${JSON.stringify(currentSpec.gradientConfig)}\n`;
    }
    if (lockedElements.typography) {
      prompt += `- Typography: keep exact fonts and weights: ${JSON.stringify(currentSpec.typography)}\n`;
    }
    if (lockedElements.accentColor) {
      prompt += `- Accent colour: keep palette.accent "${currentSpec.palette.accent}" and palette.secondary "${currentSpec.palette.secondary}"\n`;
    }
    if (lockedElements.layout) {
      prompt += `- Layout style: keep layoutStyle "${currentSpec.layoutStyle}"\n`;
    }
    if (lockedElements.graphicElements) {
      prompt += `- Graphic elements: keep graphicElements array exactly: ${JSON.stringify(currentSpec.graphicElements)}\n`;
    }
    if (lockedElements.contentAngle && mode === 'build') {
      prompt += `- Content angle: keep contentAngle "${currentSpec.contentAngle}" — regenerate slides with this same narrative framing\n`;
    }
    prompt += `\nOnly regenerate the unlocked elements. Make sure the result is still cohesive.\n\n`;
  }

  // --- Output format ---
  prompt += `OUTPUT: Return only a single valid JSON object matching this exact structure:
{
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
  "contentAngle": "Brief description of the narrative approach",
  "trendNote": "Current design trend this draws from"
}

gradientConfig is only required when backgroundStyle is "gradient". Otherwise omit it.
graphicElements array must have 1 to 4 items.
`;

  return prompt;
}
