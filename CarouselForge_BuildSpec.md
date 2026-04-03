# CarouselForge — Complete Build Specification
> Hand this document to Antigravity. It contains every decision, screen, function, API call, prompt, and file needed to build CarouselForge from zero to deployed. No decisions should need to be made mid-build.

---

## 1. What This App Is

A Canva App (runs as a panel inside Canva) that reads or generates carousel content, applies an AI-generated design system, and builds finished 1:1 slides directly onto the open Canva canvas. Powered by Gemini API (free tier). Built with Canva Apps SDK (React + TypeScript).

---

## 2. One-Time Setup (Before Any Code)

These accounts must exist before the build starts. The builder should prompt the user to complete each step and paste in the required keys.

### 2.1 Canva Developer Account
1. Go to developer.canva.com
2. Sign in with the same Canva account used daily
3. Click "Create an app"
4. Name it: CarouselForge
5. Select app type: Canva App (panel)
6. Copy the App ID — store as `CANVA_APP_ID`

### 2.2 Gemini API Key
1. Go to aistudio.google.com
2. Sign in with a Google account
3. Click "Get API Key" → "Create API Key"
4. Copy the key — store as `GEMINI_API_KEY`
5. Model to use: `gemini-2.0-flash` (free tier, 1500 requests/day, 1M token context)

### 2.3 GitHub Repo
1. Create a new private repo named `carousel-forge`
2. This is where Antigravity pushes the code

### 2.4 Vercel Account
1. Go to vercel.com, sign in with GitHub
2. Import the `carousel-forge` repo
3. Add environment variable: `GEMINI_API_KEY` = the key from step 2.2
4. Note the deployed URL (format: `https://carousel-forge-xxx.vercel.app`)
5. Paste this URL back into the Canva Developer dashboard under App URL

---

## 3. Project Structure

```
carousel-forge/
├── src/
│   ├── app.tsx                  # Root component, mode detection, routing
│   ├── main.tsx                 # Canva SDK entry point
│   ├── index.html
│   ├── components/
│   │   ├── ModeToggle.tsx       # Restyle / Build mode switch
│   │   ├── ScriptInput.tsx      # Script textarea + slide preview
│   │   ├── VibeInput.tsx        # Vibe prompt textarea
│   │   ├── DesignPanel.tsx      # The Coolors-style shuffle interface
│   │   ├── DesignCard.tsx       # Individual lockable/shuffleable element card
│   │   ├── SlidePreview.tsx     # Per-slide extracted text preview with toggle
│   │   ├── BuildButton.tsx      # Final apply-to-canvas button with loading state
│   │   └── StatusBar.tsx        # Error states, loading messages, success
│   ├── hooks/
│   │   ├── useCanvasReader.ts   # Reads existing content from open Canva design
│   │   ├── useGemini.ts         # All Gemini API calls
│   │   └── useDesignState.ts    # Lock/shuffle state management
│   ├── lib/
│   │   ├── gemini.ts            # Raw Gemini API client
│   │   ├── canvasWriter.ts      # All Canva SDK write operations
│   │   ├── canvasReader.ts      # All Canva SDK read operations
│   │   ├── styleLibrary.ts      # 8 base vibes + refresh logic
│   │   ├── promptBuilder.ts     # Assembles Gemini prompts
│   │   └── types.ts             # All TypeScript interfaces
│   └── styles/
│       └── panel.css            # App panel UI styles
├── api/
│   └── refresh-library.ts       # Vercel serverless function for weekly vibe refresh
├── .env.local                   # GEMINI_API_KEY (local dev only, never committed)
├── canva.config.ts              # Canva SDK config
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Dependencies

```json
{
  "dependencies": {
    "@canva/app-ui-kit": "latest",
    "@canva/design": "latest",
    "@canva/platform": "latest",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "latest",
    "canva-cli": "latest"
  }
}
```

Bootstrap with the official Canva starter:
```bash
npx create-canva-app@latest carousel-forge --template=react-typescript
cd carousel-forge
npm install
```

---

## 5. TypeScript Interfaces (types.ts)

```typescript
// The full design system Gemini returns
export interface DesignSpec {
  vibe: string;
  vibeName: string;
  palette: {
    background: string;       // hex
    primary: string;          // hex - main text colour
    accent: string;           // hex - highlights, rules, tags
    secondary: string;        // hex - body text, subtext
  };
  typography: {
    heading: {
      fontFamily: string;     // must be from CANVA_FREE_FONTS list
      fontWeight: '400' | '700' | '900';
      letterSpacing: number;  // em units, e.g. -0.02
    };
    body: {
      fontFamily: string;
      fontWeight: '400' | '500';
      letterSpacing: number;
    };
    accent: {
      fontFamily: string;     // used for labels, slide numbers
      fontWeight: '400' | '700';
    };
  };
  backgroundStyle: 'solid' | 'gradient' | 'noise' | 'split';
  gradientConfig?: {
    angle: number;
    colorStop1: string;
    colorStop2: string;
  };
  layoutStyle: 'centered' | 'left_heavy' | 'asymmetric' | 'top_anchored';
  graphicElements: GraphicElement[];
  slides: SlideSpec[];
  contentAngle: string;       // brief description of narrative framing
  trendNote: string;          // e.g. "bold editorial, trending Q1 2025"
}

export interface SlideSpec {
  index: number;
  type: 'hook' | 'point' | 'elaboration' | 'callout' | 'cta';
  heading: string;
  body: string | null;
  label: string | null;       // e.g. "01", "Key Insight", "Tip 3"
  layout: SlideLayout;
}

export interface SlideLayout {
  headingPosition: ElementPosition;
  bodyPosition: ElementPosition | null;
  labelPosition: ElementPosition | null;
  headingFontSize: number;    // px, based on 1080x1080
  bodyFontSize: number;
  textAlign: 'left' | 'center' | 'right';
}

export interface ElementPosition {
  x: number;                  // percentage of canvas width, 0-100
  y: number;                  // percentage of canvas height, 0-100
  width: number;              // percentage of canvas width
  maxLines?: number;
}

export interface GraphicElement {
  type: 'horizontal_rule' | 'corner_tag' | 'circle_accent' | 
        'side_bar' | 'background_shape' | 'dot_grid' | 'slash_divider';
  position: ElementPosition;
  color: 'accent' | 'primary' | 'secondary'; // references palette
  opacity: number;            // 0-1
  size: number;               // relative size unit
}

export interface ExtractedSlide {
  pageIndex: number;
  textBlocks: ExtractedTextBlock[];
  include: boolean;           // user toggle
  dimensions: { width: number; height: number };
}

export interface ExtractedTextBlock {
  id: string;
  text: string;
  isHeading: boolean;         // detected by font size
  x: number;
  y: number;
  width: number;
  height: number;
}

// Lock state for shuffle mechanic
export interface LockState {
  background: boolean;
  typography: boolean;
  accentColor: boolean;
  layout: boolean;
  graphicElements: boolean;
  contentAngle: boolean;
}

export type AppMode = 'restyle' | 'build';
```

---

## 6. The Canva Free Font List

Gemini must only choose from this list. Include it in every prompt. This is the complete list of quality fonts available on Canva Free plan:

```typescript
// lib/styleLibrary.ts
export const CANVA_FREE_FONTS = [
  // Sans-serif
  'Montserrat', 'Raleway', 'Oswald', 'Nunito', 'Poppins',
  'Work Sans', 'DM Sans', 'Plus Jakarta Sans', 'Outfit',
  'Barlow', 'Urbanist', 'Jost', 'Manrope',
  // Serif
  'Playfair Display', 'Cormorant Garamond', 'DM Serif Display',
  'Libre Baskerville', 'Lora', 'Abril Fatface',
  // Display / Decorative
  'Bebas Neue', 'Anton', 'Black Han Sans',
  'Righteous', 'Bungee', 'Titan One',
  // Mono / Technical
  'Space Mono', 'JetBrains Mono', 'Fira Code',
  // Handwriting (use sparingly)
  'Caveat', 'Pacifico'
];
```

---

## 7. The 8 Base Vibes (styleLibrary.ts)

These are the hardcoded seed vibes. The weekly refresh adds to this list but never removes these 8.

```typescript
export const BASE_VIBES: Partial<DesignSpec>[] = [
  {
    vibeName: 'Bold Minimal',
    palette: { background: '#FFFFFF', primary: '#0A0A0A', accent: '#FF3B30', secondary: '#666666' },
    typography: {
      heading: { fontFamily: 'Bebas Neue', fontWeight: '400', letterSpacing: 0.02 },
      body: { fontFamily: 'Work Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Work Sans', fontWeight: '700', letterSpacing: 0.1 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'side_bar', position: { x: 0, y: 0, width: 1.5 }, color: 'accent', opacity: 1, size: 1 },
      { type: 'horizontal_rule', position: { x: 8, y: 78, width: 84 }, color: 'accent', opacity: 0.3, size: 1 }
    ]
  },
  {
    vibeName: 'Dark Editorial',
    palette: { background: '#0D0D0D', primary: '#F5F5F5', accent: '#7B2FFF', secondary: '#A3A3A3' },
    typography: {
      heading: { fontFamily: 'Playfair Display', fontWeight: '700', letterSpacing: -0.02 },
      body: { fontFamily: 'DM Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Space Mono', fontWeight: '400', letterSpacing: 0.05 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'corner_tag', position: { x: 82, y: 82, width: 15 }, color: 'accent', opacity: 0.8, size: 1 },
      { type: 'circle_accent', position: { x: -5, y: -5, width: 30 }, color: 'accent', opacity: 0.06, size: 1 }
    ]
  },
  {
    vibeName: 'Neon Maximalist',
    palette: { background: '#050505', primary: '#FFFFFF', accent: '#00FF88', secondary: '#FF006E' },
    typography: {
      heading: { fontFamily: 'Anton', fontWeight: '400', letterSpacing: 0.01 },
      body: { fontFamily: 'Barlow', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Space Mono', fontWeight: '400', letterSpacing: 0.08 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'asymmetric',
    graphicElements: [
      { type: 'background_shape', position: { x: 60, y: 0, width: 50 }, color: 'accent', opacity: 0.05, size: 1 },
      { type: 'slash_divider', position: { x: 8, y: 50, width: 84 }, color: 'secondary', opacity: 0.5, size: 1 }
    ]
  },
  {
    vibeName: 'Scrapbook',
    palette: { background: '#F5EDD6', primary: '#1A1008', accent: '#C4622D', secondary: '#5C4A2A' },
    typography: {
      heading: { fontFamily: 'Abril Fatface', fontWeight: '400', letterSpacing: -0.01 },
      body: { fontFamily: 'Lora', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Caveat', fontWeight: '700', letterSpacing: 0 }
    },
    backgroundStyle: 'noise',
    layoutStyle: 'top_anchored',
    graphicElements: [
      { type: 'horizontal_rule', position: { x: 8, y: 35, width: 84 }, color: 'accent', opacity: 0.4, size: 1 },
      { type: 'dot_grid', position: { x: 70, y: 65, width: 25 }, color: 'secondary', opacity: 0.15, size: 1 }
    ]
  },
  {
    vibeName: 'Notes App',
    palette: { background: '#FAFAFA', primary: '#1C1C1E', accent: '#007AFF', secondary: '#8E8E93' },
    typography: {
      heading: { fontFamily: 'Plus Jakarta Sans', fontWeight: '700', letterSpacing: -0.01 },
      body: { fontFamily: 'Plus Jakarta Sans', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Plus Jakarta Sans', fontWeight: '500', letterSpacing: 0 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'side_bar', position: { x: 8, y: 15, width: 0.8 }, color: 'accent', opacity: 1, size: 1 }
    ]
  },
  {
    vibeName: 'Retro Academic',
    palette: { background: '#2B1810', primary: '#F0E6D3', accent: '#D4A853', secondary: '#C4956A' },
    typography: {
      heading: { fontFamily: 'Cormorant Garamond', fontWeight: '700', letterSpacing: 0.02 },
      body: { fontFamily: 'Libre Baskerville', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Raleway', fontWeight: '700', letterSpacing: 0.15 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'corner_tag', position: { x: 5, y: 5, width: 12 }, color: 'accent', opacity: 0.6, size: 1 },
      { type: 'corner_tag', position: { x: 83, y: 83, width: 12 }, color: 'accent', opacity: 0.6, size: 1 }
    ]
  },
  {
    vibeName: 'Gradient Glass',
    palette: { background: '#0F0C29', primary: '#FFFFFF', accent: '#F64F59', secondary: 'rgba(255,255,255,0.6)' },
    typography: {
      heading: { fontFamily: 'Urbanist', fontWeight: '900', letterSpacing: -0.03 },
      body: { fontFamily: 'Manrope', fontWeight: '400', letterSpacing: 0 },
      accent: { fontFamily: 'Manrope', fontWeight: '500', letterSpacing: 0.05 }
    },
    backgroundStyle: 'gradient',
    gradientConfig: { angle: 135, colorStop1: '#0F0C29', colorStop2: '#302B63' },
    layoutStyle: 'centered',
    graphicElements: [
      { type: 'circle_accent', position: { x: 30, y: 10, width: 40 }, color: 'accent', opacity: 0.08, size: 1 }
    ]
  },
  {
    vibeName: 'Blueprint',
    palette: { background: '#0A1628', primary: '#E8F4FD', accent: '#00D4FF', secondary: '#7BA7C7' },
    typography: {
      heading: { fontFamily: 'Oswald', fontWeight: '700', letterSpacing: 0.05 },
      body: { fontFamily: 'JetBrains Mono', fontWeight: '400', letterSpacing: -0.01 },
      accent: { fontFamily: 'JetBrains Mono', fontWeight: '400', letterSpacing: 0.1 }
    },
    backgroundStyle: 'solid',
    layoutStyle: 'left_heavy',
    graphicElements: [
      { type: 'dot_grid', position: { x: 0, y: 0, width: 100 }, color: 'accent', opacity: 0.04, size: 1 },
      { type: 'side_bar', position: { x: 0, y: 0, width: 0.5 }, color: 'accent', opacity: 1, size: 1 }
    ]
  }
];
```

---

## 8. Gemini Prompt Engineering (promptBuilder.ts)

This is the most critical file. Every Gemini call uses `buildDesignPrompt()`.

```typescript
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
```

---

## 9. Gemini API Client (gemini.ts)

```typescript
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export async function callGemini(prompt: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  const response = await fetch(`${GEMINI_ENDPOINT}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.85,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(`Gemini error: ${err.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty response from Gemini');
  return raw;
}

export async function parseDesignSpec(raw: string): Promise<DesignSpec> {
  // Strip any accidental markdown fences
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  try {
    return JSON.parse(cleaned) as DesignSpec;
  } catch (e) {
    throw new Error(`Failed to parse Gemini response as JSON: ${e}`);
  }
}
```

---

## 10. Canvas Reader (canvasReader.ts)

```typescript
import { getCurrentPageContext, getPageDimensions } from '@canva/design';
import { ExtractedSlide, ExtractedTextBlock } from '../types';

export async function readAllSlides(): Promise<ExtractedSlide[]> {
  const context = await getCurrentPageContext();
  const pages = context.pages;

  const slides: ExtractedSlide[] = [];

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    const textBlocks: ExtractedTextBlock[] = [];

    for (const element of page.elements) {
      if (element.type === 'TEXT') {
        const fontSize = element.fontSize ?? 16;
        textBlocks.push({
          id: element.id,
          text: element.text.plaintext,
          isHeading: fontSize >= 32,
          x: element.left,
          y: element.top,
          width: element.width,
          height: element.height
        });
      }
    }

    slides.push({
      pageIndex: i,
      textBlocks: textBlocks.sort((a, b) => a.y - b.y), // top to bottom order
      include: true,
      dimensions: {
        width: page.width,
        height: page.height
      }
    });
  }

  return slides;
}

export function hasExistingContent(slides: ExtractedSlide[]): boolean {
  return slides.some(s => s.textBlocks.length > 0);
}
```

---

## 11. Canvas Writer (canvasWriter.ts)

This is the most complex file. It translates a DesignSpec into actual Canva elements.

```typescript
import {
  getCurrentPageContext,
  addNativeElement,
  setCurrentPageBackground,
  clearPage,
  addPage,
  getDefaultPageDimensions
} from '@canva/design';
import { DesignSpec, SlideSpec, GraphicElement } from '../types';

const CANVAS_SIZE = 1080; // All operations in 1080x1080 space

// Convert percentage position to pixel values
function pct(val: number): number {
  return (val / 100) * CANVAS_SIZE;
}

export async function applyDesignToCanvas(
  spec: DesignSpec,
  mode: 'restyle' | 'build',
  existingPageCount: number
): Promise<void> {
  const context = await getCurrentPageContext();
  const pageCount = context.pages.length;

  // Ensure we have the right number of pages
  if (mode === 'build') {
    // Add pages if needed
    while (context.pages.length < spec.slides.length) {
      await addPage();
    }
  }

  // Apply each slide
  for (let i = 0; i < spec.slides.length; i++) {
    await applySlide(spec, spec.slides[i], i);
  }
}

async function applySlide(
  spec: DesignSpec,
  slide: SlideSpec,
  pageIndex: number
): Promise<void> {
  // 1. Set background
  await applyBackground(spec, pageIndex);

  // 2. Clear existing design elements (keep text in restyle mode — handled by caller)
  // In build mode, clear everything first
  // In restyle mode, only clear non-text elements

  // 3. Add graphic elements (decorative shapes)
  for (const el of spec.graphicElements) {
    await addGraphicElement(el, spec, pageIndex);
  }

  // 4. Add label if present
  if (slide.label && slide.layout.labelPosition) {
    await addNativeElement({
      type: 'TEXT',
      pageIndex,
      top: pct(slide.layout.labelPosition.y),
      left: pct(slide.layout.labelPosition.x),
      width: pct(slide.layout.labelPosition.width),
      children: [{
        text: slide.label,
        fontSize: 16,
        fontFamily: spec.typography.accent.fontFamily,
        fontWeight: spec.typography.accent.fontWeight,
        color: spec.palette.accent,
        letterSpacing: spec.typography.accent.letterSpacing,
        textAlign: slide.layout.textAlign,
        textTransform: 'uppercase'
      }]
    });
  }

  // 5. Add heading
  await addNativeElement({
    type: 'TEXT',
    pageIndex,
    top: pct(slide.layout.headingPosition.y),
    left: pct(slide.layout.headingPosition.x),
    width: pct(slide.layout.headingPosition.width),
    children: [{
      text: slide.heading,
      fontSize: slide.layout.headingFontSize,
      fontFamily: spec.typography.heading.fontFamily,
      fontWeight: spec.typography.heading.fontWeight,
      color: spec.palette.primary,
      letterSpacing: spec.typography.heading.letterSpacing,
      textAlign: slide.layout.textAlign
    }]
  });

  // 6. Add body if present
  if (slide.body && slide.layout.bodyPosition) {
    await addNativeElement({
      type: 'TEXT',
      pageIndex,
      top: pct(slide.layout.bodyPosition.y),
      left: pct(slide.layout.bodyPosition.x),
      width: pct(slide.layout.bodyPosition.width),
      children: [{
        text: slide.body,
        fontSize: slide.layout.bodyFontSize,
        fontFamily: spec.typography.body.fontFamily,
        fontWeight: spec.typography.body.fontWeight,
        color: spec.palette.secondary,
        letterSpacing: spec.typography.body.letterSpacing,
        textAlign: slide.layout.textAlign
      }]
    });
  }
}

async function applyBackground(spec: DesignSpec, pageIndex: number): Promise<void> {
  if (spec.backgroundStyle === 'solid') {
    await setCurrentPageBackground({
      pageIndex,
      fill: { type: 'SOLID', color: spec.palette.background }
    });
  } else if (spec.backgroundStyle === 'gradient' && spec.gradientConfig) {
    await setCurrentPageBackground({
      pageIndex,
      fill: {
        type: 'GRADIENT',
        stops: [
          { color: spec.gradientConfig.colorStop1, position: 0 },
          { color: spec.gradientConfig.colorStop2, position: 1 }
        ],
        gradientType: 'LINEAR',
        rotation: spec.gradientConfig.angle
      }
    });
  } else {
    // noise and split fall back to solid for now (noise requires image generation)
    await setCurrentPageBackground({
      pageIndex,
      fill: { type: 'SOLID', color: spec.palette.background }
    });
  }
}

async function addGraphicElement(
  el: GraphicElement,
  spec: DesignSpec,
  pageIndex: number
): Promise<void> {
  const color = el.color === 'accent' ? spec.palette.accent
    : el.color === 'primary' ? spec.palette.primary
    : spec.palette.secondary;

  const x = pct(el.position.x);
  const y = pct(el.position.y);
  const w = pct(el.position.width);

  switch (el.type) {
    case 'horizontal_rule':
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'side_bar':
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: 0, left: x, width: pct(1.2), height: CANVAS_SIZE,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'circle_accent':
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        shapeType: 'ELLIPSE',
        top: y, left: x, width: w, height: w,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'corner_tag':
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      // Vertical part of corner
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: y, left: x, width: 2, height: w,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'background_shape':
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: y, left: x, width: w, height: w,
        fill: { type: 'SOLID', color },
        opacity: el.opacity,
        rotation: 45
      });
      break;

    case 'dot_grid':
      // Draw a 4x4 dot grid
      const dotSize = 4;
      const spacing = pct(3);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
          await addNativeElement({
            type: 'SHAPE',
            pageIndex,
            shapeType: 'ELLIPSE',
            top: y + row * spacing,
            left: x + col * spacing,
            width: dotSize, height: dotSize,
            fill: { type: 'SOLID', color },
            opacity: el.opacity
          });
        }
      }
      break;

    case 'slash_divider':
      // Diagonal line using a thin rotated rectangle
      await addNativeElement({
        type: 'SHAPE',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity,
        rotation: -15
      });
      break;
  }
}
```

---

## 12. App UI (app.tsx)

```typescript
import { useState, useEffect } from 'react';
import { useCanvasReader } from './hooks/useCanvasReader';
import { useGemini } from './hooks/useGemini';
import { useDesignState } from './hooks/useDesignState';
import { ModeToggle } from './components/ModeToggle';
import { ScriptInput } from './components/ScriptInput';
import { VibeInput } from './components/VibeInput';
import { DesignPanel } from './components/DesignPanel';
import { SlidePreview } from './components/SlidePreview';
import { BuildButton } from './components/BuildButton';
import { StatusBar } from './components/StatusBar';
import { applyDesignToCanvas } from './lib/canvasWriter';

export function App() {
  const [mode, setMode] = useState<'restyle' | 'build'>('build');
  const [script, setScript] = useState('');
  const [vibePrompt, setVibePrompt] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'building' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { extractedSlides, toggleSlide, refreshSlides } = useCanvasReader();
  const { designSpec, generateDesign, shuffleElements } = useGemini();
  const { lockState, toggleLock } = useDesignState();

  // Auto-detect mode on mount
  useEffect(() => {
    refreshSlides().then(slides => {
      if (slides && slides.some(s => s.textBlocks.length > 0)) {
        setMode('restyle');
      }
    });
  }, []);

  const handleGenerate = async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      await generateDesign({
        mode,
        script: script || null,
        vibePrompt: vibePrompt || null,
        existingSlides: mode === 'restyle' ? extractedSlides : null,
        lockedElements: lockState,
        shuffleTarget: 'all'
      });
      setStatus('ready');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  const handleShuffle = async (target: keyof typeof lockState | 'all') => {
    setStatus('loading');
    try {
      await shuffleElements(target, {
        mode,
        script: script || null,
        vibePrompt: vibePrompt || null,
        existingSlides: mode === 'restyle' ? extractedSlides : null,
        lockedElements: lockState
      });
      setStatus('ready');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  const handleBuild = async () => {
    if (!designSpec) return;
    setStatus('building');
    try {
      await applyDesignToCanvas(designSpec, mode, extractedSlides?.length ?? 0);
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setErrorMessage(e.message);
    }
  };

  return (
    <div className="panel">
      <header className="panel-header">
        <h1>CarouselForge</h1>
        <ModeToggle mode={mode} onChange={setMode} />
      </header>

      {mode === 'restyle' && extractedSlides && (
        <SlidePreview slides={extractedSlides} onToggle={toggleSlide} />
      )}

      <ScriptInput
        value={script}
        onChange={setScript}
        mode={mode}
        placeholder={mode === 'build'
          ? 'Paste your script, a paragraph topic, or leave blank to generate fresh content...'
          : 'Optional: paste any additional context or direction for this restyle...'
        }
      />

      <VibeInput
        value={vibePrompt}
        onChange={setVibePrompt}
        placeholder='Optional: describe a vibe (e.g. "dark and editorial", "warm and scrapbook", "clean notes app feel")...'
      />

      <button
        className="generate-btn"
        onClick={handleGenerate}
        disabled={status === 'loading' || status === 'building'}
      >
        {status === 'loading' ? 'Generating...' : 'Generate Design'}
      </button>

      {designSpec && status !== 'loading' && (
        <DesignPanel
          spec={designSpec}
          lockState={lockState}
          onToggleLock={toggleLock}
          onShuffle={handleShuffle}
        />
      )}

      {designSpec && status === 'ready' && (
        <BuildButton onClick={handleBuild} />
      )}

      <StatusBar status={status} error={errorMessage} />
    </div>
  );
}
```

---

## 13. Design Panel UI (DesignPanel.tsx)

The Coolors-style interface. Six cards in a scrollable column.

```typescript
import { DesignCard } from './DesignCard';
import { DesignSpec, LockState } from '../types';

const CARDS = [
  {
    key: 'background' as keyof LockState,
    label: 'Background',
    getPreview: (spec: DesignSpec) => spec.palette.background,
    getDescription: (spec: DesignSpec) => `${spec.backgroundStyle} · ${spec.palette.background}`
  },
  {
    key: 'typography' as keyof LockState,
    label: 'Typography',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) =>
      `${spec.typography.heading.fontFamily} / ${spec.typography.body.fontFamily}`
  },
  {
    key: 'accentColor' as keyof LockState,
    label: 'Accent Colour',
    getPreview: (spec: DesignSpec) => spec.palette.accent,
    getDescription: (spec: DesignSpec) => spec.palette.accent
  },
  {
    key: 'layout' as keyof LockState,
    label: 'Layout Style',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) => spec.layoutStyle.replace('_', ' ')
  },
  {
    key: 'graphicElements' as keyof LockState,
    label: 'Graphic Elements',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) =>
      spec.graphicElements.map(e => e.type.replace('_', ' ')).join(', ')
  },
  {
    key: 'contentAngle' as keyof LockState,
    label: 'Content Angle',
    getPreview: (spec: DesignSpec) => null,
    getDescription: (spec: DesignSpec) => spec.contentAngle
  }
];

export function DesignPanel({ spec, lockState, onToggleLock, onShuffle }) {
  return (
    <div className="design-panel">
      <div className="panel-meta">
        <span className="vibe-name">{spec.vibeName}</span>
        <span className="trend-note">{spec.trendNote}</span>
      </div>

      <div className="cards-list">
        {CARDS.map(card => (
          <DesignCard
            key={card.key}
            label={card.label}
            preview={card.getPreview(spec)}
            description={card.getDescription(spec)}
            locked={lockState[card.key]}
            onToggleLock={() => onToggleLock(card.key)}
            onShuffle={() => onShuffle(card.key)}
          />
        ))}
      </div>

      <div className="shuffle-controls">
        <button className="shuffle-all-btn" onClick={() => onShuffle('all')}>
          Shuffle All Unlocked
        </button>
      </div>
    </div>
  );
}
```

---

## 14. Weekly Style Library Refresh (api/refresh-library.ts)

Vercel serverless function. Can be triggered manually or via a cron job.

```typescript
// Vercel cron: runs every Sunday at 00:00 UTC
// Set in vercel.json: { "crons": [{ "path": "/api/refresh-library", "schedule": "0 0 * * 0" }] }

import { callGemini } from '../src/lib/gemini';

const REFRESH_PROMPT = `
You are a social media design trend analyst. Based on current viral carousel trends from Instagram, TikTok, and LinkedIn (educational content, as of 2025-2026), generate 3 new design vibe presets that are trending RIGHT NOW but not yet mainstream.

Return a JSON array of 3 vibe objects. Each must follow the same structure as BASE_VIBES in the app. Only use fonts from this list: Montserrat, Raleway, Oswald, Nunito, Poppins, Work Sans, DM Sans, Plus Jakarta Sans, Outfit, Barlow, Urbanist, Jost, Manrope, Playfair Display, Cormorant Garamond, DM Serif Display, Libre Baskerville, Lora, Abril Fatface, Bebas Neue, Anton, Black Han Sans, Righteous, Bungee, Titan One, Space Mono, JetBrains Mono, Fira Code, Caveat, Pacifico.

Return ONLY a JSON array. No preamble.
`;

export default async function handler(req, res) {
  if (req.method !== 'POST' && req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await callGemini(REFRESH_PROMPT);
    const newVibes = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```/g, '').trim());
    // In production: store to a KV store or Vercel blob storage
    // For MVP: return the new vibes and the app merges them at startup
    res.status(200).json({ vibes: newVibes, refreshedAt: new Date().toISOString() });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
```

---

## 15. Panel CSS (panel.css)

Clean, dark, minimal panel UI appropriate for a Canva app sidebar.

```css
:root {
  --bg: #1a1a1a;
  --surface: #242424;
  --border: #333;
  --text: #f0f0f0;
  --text-muted: #888;
  --accent: #7B2FFF;
  --accent-hover: #9B4FFF;
  --danger: #FF3B30;
  --success: #30D158;
  --font: 'Inter', system-ui, sans-serif;
  --radius: 8px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: var(--font);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}

.panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  min-height: 100vh;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h1 {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.3px;
}

textarea {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  color: var(--text);
  padding: 10px 12px;
  font-family: var(--font);
  font-size: 12px;
  line-height: 1.5;
  resize: vertical;
  min-height: 72px;
  transition: border-color 0.15s;
}

textarea:focus {
  outline: none;
  border-color: var(--accent);
}

textarea::placeholder { color: var(--text-muted); }

.generate-btn {
  width: 100%;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius);
  padding: 10px;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.15s;
}

.generate-btn:hover { background: var(--accent-hover); }
.generate-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.design-panel { display: flex; flex-direction: column; gap: 8px; }

.panel-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.vibe-name {
  font-weight: 700;
  font-size: 13px;
}

.trend-note {
  font-size: 10px;
  color: var(--text-muted);
  text-align: right;
  max-width: 55%;
}

.cards-list { display: flex; flex-direction: column; gap: 6px; }

.design-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.design-card.locked {
  border-color: var(--accent);
}

.card-color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  flex-shrink: 0;
  border: 1px solid rgba(255,255,255,0.1);
}

.card-text { flex: 1; min-width: 0; }
.card-label { font-weight: 600; font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.card-description { font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-actions { display: flex; gap: 4px; flex-shrink: 0; }

.icon-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  font-size: 14px;
  transition: color 0.15s, background 0.15s;
}

.icon-btn:hover { color: var(--text); background: rgba(255,255,255,0.06); }
.icon-btn.active { color: var(--accent); }

.shuffle-controls { padding-top: 4px; }

.shuffle-all-btn {
  width: 100%;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text);
  border-radius: var(--radius);
  padding: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.shuffle-all-btn:hover { border-color: var(--accent); background: rgba(123,47,255,0.08); }

.build-btn {
  width: 100%;
  background: var(--success);
  color: #000;
  border: none;
  border-radius: var(--radius);
  padding: 12px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.build-btn:hover { opacity: 0.9; }

.status-bar {
  font-size: 11px;
  text-align: center;
  padding: 4px;
  border-radius: 4px;
}

.status-bar.error { color: var(--danger); background: rgba(255,59,48,0.1); }
.status-bar.done { color: var(--success); }
.status-bar.loading, .status-bar.building { color: var(--text-muted); }

.mode-toggle {
  display: flex;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}

.mode-toggle button {
  background: none;
  border: none;
  color: var(--text-muted);
  padding: 4px 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}

.mode-toggle button.active {
  background: var(--accent);
  color: white;
}

.slide-preview-list {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 8px;
  max-height: 140px;
  overflow-y: auto;
}

.slide-preview-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}

.slide-preview-item:last-child { border-bottom: none; }

.slide-preview-item input[type="checkbox"] { margin-top: 2px; accent-color: var(--accent); }
.slide-preview-text { font-size: 11px; color: var(--text-muted); line-height: 1.4; }
.slide-preview-heading { color: var(--text); font-weight: 600; }
```

---

## 16. vite.config.ts

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {}
  },
  server: {
    port: 8080,
    https: true  // Canva requires HTTPS even in dev — use vite-plugin-mkcert
  }
});
```

Add `vite-plugin-mkcert` for local HTTPS:
```bash
npm install -D vite-plugin-mkcert
```

---

## 17. canva.config.ts

```typescript
import { defineConfig } from '@canva/cli';

export default defineConfig({
  appId: process.env.CANVA_APP_ID,
  developmentUrl: 'https://localhost:8080',
  productionUrl: 'https://carousel-forge-xxx.vercel.app'  // Replace with actual Vercel URL
});
```

---

## 18. vercel.json

```json
{
  "crons": [
    {
      "path": "/api/refresh-library",
      "schedule": "0 0 * * 0"
    }
  ],
  "env": {
    "GEMINI_API_KEY": "@gemini_api_key"
  }
}
```

---

## 19. Environment Variables

### Local (.env.local — never commit this file)
```
VITE_GEMINI_API_KEY=your_gemini_key_here
CANVA_APP_ID=your_canva_app_id_here
```

### Vercel Dashboard
Add these under Project Settings → Environment Variables:
- `GEMINI_API_KEY` = your Gemini key
- `CANVA_APP_ID` = your Canva app ID

---

## 20. Build Order for Antigravity

Execute in this exact sequence:

1. Run the Canva starter bootstrap command
2. Install additional dependencies
3. Create all files in `src/lib/` first (types, gemini, canvasReader, canvasWriter, styleLibrary, promptBuilder)
4. Create all hooks in `src/hooks/`
5. Create all components in `src/components/`
6. Wire up `app.tsx` and `main.tsx`
7. Add `panel.css`
8. Add `vite.config.ts`, `canva.config.ts`, `vercel.json`
9. Create `api/refresh-library.ts`
10. Test locally with `npm run start`
11. Push to GitHub
12. Deploy on Vercel
13. Paste the Vercel URL into Canva Developer dashboard
14. Test the app inside Canva

---

## 21. Known Limitations of Canva Free Plan

- Cannot access premium Canva templates programmatically
- Cannot use premium fonts (the CANVA_FREE_FONTS list in Section 6 accounts for this)
- Cannot export directly via API (user exports manually as usual)
- The Apps SDK write operations are subject to Canva's element limits per page

None of these limitations affect the core functionality of CarouselForge.

---

## 22. What Is NOT In Scope (V1)

These are intentionally deferred to a V2:

- Saving favourite design combinations to a personal library
- Drag-to-reorder slide sequence
- Image/photo insertion into slides
- Brand colour persistence across sessions
- Direct TikTok / LinkedIn publishing via API

---

*End of CarouselForge Build Specification v1.0*
