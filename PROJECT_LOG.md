# CarouselForge: Project History & Architectural Log
**Purpose of this Document:** 
This is a living log designed to provide complete context to any AI agent, developer, or collaborator inherited this codebase. It tracks the evolution of the project, fundamental design decisions, structural pivots, and historical bugs encountered chronologically.

***

## 🎯 The Core Mission
**CarouselForge** is an AI-powered design engine. The goal is to allow creators to input text (like a LinkedIn post or a script topic) and instantly receive a perfectly structured, aesthetically pleasing 1080x1080 social media carousel.

---

## 📅 Chronological Log

### Phase 1: The Initial Canva Integration Era 
**Premise:** The original intent was to build CarouselForge directly *inside* Canva as a "Canva App" using the `@canva/design` SDK. This would theoretically allow users to generate designs straight into their open Canva tabs.

**Architectural Decisions & Features:**
- Used a split-panel UI (React) injected into the Canva editor.
- Wired Gemini API (`gemini-2.5-flash`) via a Serverless endpoint (`/api/generate-design.ts`) to return JSON representing canvas elements.

**Key Bugs & Errors Encountered:**
1. **The "Solid Square" Rendering Bug:**
   - *Problem:* Decorative graphic elements (circles, SVG borders, accents) rendered as giant, opaque black squares.
   - *Cause:* The `buildElementList` parsing loop failed to map abstract Gemini JSON shapes to rigid Canva `ShapeType` constants.
   - *Resolution:* Implemented specific matching logic in `canvasWriter.ts` to natively generate Canva SVGs based on string markers (`circle_accent`, `slash_divider`).
2. **The 8-Digit Alpha-Hex Crash:**
   - *Problem:* `Invalid element state: Invalid color: #00FFFF26. Color should be a valid 6 digit hex color code.`
   - *Cause:* The AI tried to create transparent backgrounds behind text. The Canva SDK strict-throws on any CSS hex code over 6 characters (rejecting the alpha channel).
   - *Resolution:* Created a `blendColors()` mathematical function to artificially calculate the *resulting* opaque RGB color when a transparent element sits over the background.

***

### Phase 2: The "Mathematical Blueprint" (AI Prompt Overhaul)
**Premise:** The AI had zero sense of graphic design. Early generations had awful layouts, zero hierarchy, and overlapping text, because the AI relies entirely on mathematical output since it lacks eyes.

**Architectural Decisions:**
- Scrapped "vibe-based" instructions entirely from the system prompt.
- **The Fix:** Rewrote `promptBuilder.ts` into a strict *Mathematical Design Rulebook*. We provided absolute algebraic constraints for spatial alignment (e.g., `"y_pos = prev_element.y + prev_element.height + 40"`).
- We also enforced strict design logic (e.g., High-contrast color enforcement, horizontal rule dividing bounds).

***

### Phase 3: The Standalone App Pivot (April 4, 2026)
**Premise:** The Canva SDK proved to be a "walled garden." Features like drop-shadows, native layer opacity, offline exporting, and allowing the AI to read precise DOM elements for a bidrectional memory loop were entirely blocked by Canva's internal architecture. 

*Decision:* We abandoned Canva entirely to build a custom, independent SaaS Native Editing interface.

**Architectural Decisions & Changes:**
1. **Rendering Engine Migration:** Swapped the `@canva/design` canvas hook for `react-konva`. We now completely manage the HTML5 `Stage` and `Layers` ourselves natively in `CanvasEditor.tsx`.
2. **State Management:** Brought in `Zustand` (`store.ts`) to act as the global brain holding the AI's `DesignSpec` JSON.
3. **UI Engine Migration:** Uninstalled the legacy Canva UI Kit, deleted old `index.css` constraints, installed `@tailwindcss/vite`, and designed a minimalist 2-column SaaS layout.
4. **Backend Elimination:** Brought the Gemini execution straight into the frontend (`src/lib/gemini.ts`) using the user's `VITE_GEMINI_API_KEY` to strip away reliance on the Vercel serverless layer, achieving an entirely "local/free" native hosting setup.
5. **Exporter Pipeline:** Wrote a headless generator script using `jszip` (`lib/exporter.ts`) to secretly re-render all slide JSON data onto a hidden Konva canvas, parse the images to base64, and let the user download a zip automatically.

**Key Bugs & Errors Encountered:**
1. **Tailwind PostCSS Compatibility Crash (`plugin:vite:css` Error):**
   - *Problem:* Vite threw a red screen of death stating tailwindcss could not run directly as a PostCSS plugin.
   - *Cause:* Mixing legacy Tailwind build mechanisms with Tailwind V4.
   - *Resolution:* Uninstalled standard plugins, installed `@tailwindcss/vite` natively, and swapped `@tailwind` CSS decorators to `@import "tailwindcss"` in `index.css`.
2. **"Unexpected end of JSON input" on Local AI Generation:**
   - *Problem:* Hitting generate resulted in an empty fetch crash.
   - *Cause:* The Vite dev server (`npm run dev`) does not natively serve `/api/` endpoints unless hooked up to Vercel processes. The api call was returning a 404 HTML document.
   - *Resolution:* See *Backend Elimination* above. Transitioned the model logic strictly to client-side.

---

*(Note to any AI reading this: Continue appending to the `Chronological Log` here whenever structural changes, new bugs, or strategic decisions occur.)*

---

### Phase 4: Codebase Audit & Automation Setup (April 11, 2026)
**Author: Claude Code**

**Premise:** Full code review of the post-pivot Canva SDK codebase. Six bugs were identified and fixed. A git-hook automation system was introduced so that all future changes are automatically documented here and pushed to GitHub without manual intervention.

**Bugs Fixed:**

1. **`slash_divider` shape missing in `canvasWriter.ts`**
   - *Problem:* `buildGraphicShape()` had no case for `slash_divider`. The element silently fell through to the default rectangle shape, breaking the neon_creator template and Neon Maximalist BASE_VIBE visually.
   - *Resolution:* Added a proper parallelogram path (`M 0 0 L w-20 0 L w 23 L 20 23 Z`) that renders a clean diagonal `/` slash across the element bounds. Fixed 20px slant keeps it consistent at any width.

2. **Premature "Design applied!" alert in `app.tsx`**
   - *Problem:* `status === "done"` was set after both generation AND canvas apply. This caused the success alert "Design applied! Check your canvas." to appear immediately after Gemini finished generating, before the user had pressed "Apply to Canvas."
   - *Resolution:* Introduced a new `"generated"` status value. `handleGenerate` now sets `"generated"` on success; only `handleApplyToCanvas` sets `"done"`. The alert is gated to `wasApplied = status === "done"`.

3. **Dead code in `types.ts`**
   - *Problem:* `ExtractedSlide` and `ExtractedTextBlock` interfaces were leftovers from the old "read canvas" architecture abandoned in Phase 3. Nothing in the codebase imported them.
   - *Resolution:* Removed both interfaces entirely.

4. **Non-free fonts in `minimalist_notes` template (`templates.ts`)**
   - *Problem:* The template used `Inter` (heading/body) and `Roboto Mono` (accent) — neither is in `CANVA_FREE_FONTS`. This created an inconsistency: Gemini is explicitly told it can only use fonts from the free list, but the preset template used fonts outside that list.
   - *Resolution:* Replaced `Inter` → `Plus Jakarta Sans`, `Roboto Mono` → `Space Mono`. Both are visually equivalent and present in the free-font whitelist.

5. **`rgba()` color in `styleLibrary.ts` Gradient Glass vibe**
   - *Problem:* `secondary: 'rgba(255,255,255,0.6)'` in BASE_VIBES "Gradient Glass". Canva only accepts 6-digit hex colors. If BASE_VIBES is ever wired into the UI, this would silently corrupt the palette or crash the canvas writer.
   - *Resolution:* Pre-blended rgba(255,255,255,0.6) over `#0F0C29` background to arrive at the equivalent solid hex `#9F9EA9`.

6. **Misleading font-size clamp comment in `gemini.ts`**
   - *Problem:* Comment said "Clamp font sizes to Canva's 1-100 range" but `clampFontSize()` in `canvasWriter.ts` actually caps at 400. The two-step pipeline was not documented.
   - *Resolution:* Updated comment to explain both stages: validateSpec caps at 100 (matching AI prompt constraints of 54-86 heading / 22-38 body); canvasWriter multiplies by scale and then caps at 400.

**Automation System Introduced:**

- Created `scripts/auto-log-and-push.sh` — a bash script triggered by Claude Code's Stop hook.
- Created `.claude/settings.json` — project-level Claude Code hook configuration.
- **How it works:** After every Claude Code response that modifies source files, the script:
  1. Detects changed files via `git status --porcelain`
  2. Appends a timestamped entry to this log with attribution ("Claude Code" or "Anti Gravity")
  3. Stages all changes, commits, and pushes to `origin/master`
- **Attribution convention:**
  - `Claude Code:` — changes committed automatically via the Stop hook
  - `Anti Gravity:` — manual commits by the user (use `git commit -m "Anti Gravity: <description>"`)
