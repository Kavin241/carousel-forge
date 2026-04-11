import {
  addElementAtPoint,
  setCurrentPageBackground,
  addPage,
  getDesignMetadata,
} from "@canva/design";
import type { DesignSpec, SlideSpec, GraphicElement } from "./types";

/**
 * Applies a full DesignSpec to the Canva canvas.
 * Creates slides as pages with text and shape elements.
 */
export async function applyDesignToCanvas(spec: DesignSpec): Promise<void> {
  // Get actual page dimensions (default for the design)
  let dims = { width: 1080, height: 1080 };
  let scale = 1;
  try {
    const meta = await getDesignMetadata();
    const pageDims = meta ? meta.defaultPageDimensions : null;
    if (pageDims && pageDims.width) {
      dims = { width: pageDims.width, height: pageDims.height };
      scale = dims.width / 1080;
    }
  } catch {
    // Use default 1080x1080, scale 1
  }

  // Apply first slide to the CURRENT page
  if (spec.slides.length > 0) {
    await applySlideToCurrentPage(spec, spec.slides[0], dims, scale);
  }

  // Add subsequent slides as new pages
  for (let i = 1; i < spec.slides.length; i++) {
    const slide = spec.slides[i];
    const elements = buildPageElements(spec, slide, dims, scale);
    await addPage({
      background: { color: spec.palette.background },
      elements: elements,
    });
  }
}

/**
 * Apply the first slide to the currently active page.
 */
async function applySlideToCurrentPage(
  spec: DesignSpec,
  slide: SlideSpec,
  dims: { width: number; height: number },
  scale: number
): Promise<void> {
  // Set background
  await setCurrentPageBackground({ color: spec.palette.background });

  // Add graphic elements
  for (const el of spec.graphicElements) {
    await addGraphicElement(el, spec, dims);
  }

  // Add text elements
  await addTextElements(spec, slide, dims, scale);
}

/**
 * Build elements array for addPage() call.
 * These elements use the TextElementAtPoint / ShapeElementAtPoint format.
 */
function buildPageElements(
  spec: DesignSpec,
  slide: SlideSpec,
  dims: { width: number; height: number },
  scale: number
): any[] {
  const elements: any[] = [];

  // Graphic elements
  for (const el of spec.graphicElements) {
    const shape = buildGraphicShape(el, spec, dims);
    if (shape) {
      elements.push(shape);
    }
  }

  // Label
  if (slide.label && slide.layout.labelPosition) {
    elements.push({
      type: "text" as const,
      children: [slide.label],
      top: pct(slide.layout.labelPosition.y, dims.height),
      left: pct(slide.layout.labelPosition.x, dims.width),
      width: pct(slide.layout.labelPosition.width, dims.width),
      fontSize: clampFontSize(16 * scale),
      fontWeight: mapWeight(spec.typography.accent.fontWeight),
      color: spec.palette.accent,
      textAlign: mapTextAlign(slide.layout.textAlign),
    });
  }

  // Heading
  elements.push({
    type: "text" as const,
    children: [slide.heading],
    top: pct(slide.layout.headingPosition.y, dims.height),
    left: pct(slide.layout.headingPosition.x, dims.width),
    width: pct(slide.layout.headingPosition.width, dims.width),
    fontSize: clampFontSize(slide.layout.headingFontSize * scale),
    fontWeight: mapWeight(spec.typography.heading.fontWeight),
    color: spec.palette.primary,
    textAlign: mapTextAlign(slide.layout.textAlign),
  });

  // Body
  if (slide.body && slide.layout.bodyPosition) {
    elements.push({
      type: "text" as const,
      children: [slide.body],
      top: pct(slide.layout.bodyPosition.y, dims.height),
      left: pct(slide.layout.bodyPosition.x, dims.width),
      width: pct(slide.layout.bodyPosition.width, dims.width),
      fontSize: clampFontSize(slide.layout.bodyFontSize * scale),
      fontWeight: mapWeight(spec.typography.body.fontWeight),
      color: spec.palette.secondary,
      textAlign: mapTextAlign(slide.layout.textAlign),
    });
  }

  return elements;
}

/**
 * Add a graphic element to the current page via addElementAtPoint.
 */
async function addGraphicElement(
  el: GraphicElement,
  spec: DesignSpec,
  dims: { width: number; height: number }
): Promise<void> {
  const shape = buildGraphicShape(el, spec, dims);
  if (shape) {
    try {
      await addElementAtPoint(shape);
    } catch (e) {
      console.warn("Failed to add graphic element:", el.type, e);
    }
  }
}

/**
 * Build a shape element for a GraphicElement.
 * Uses the Canva addElementAtPoint shape format with SVG-like paths.
 * 
 * IMPORTANT Canva constraints:
 * - Paths must start with M command
 * - Only one M command per path
 * - Must be closed with Z or matching last coordinate
 * - No Q commands
 * - Max 30 paths, max 2kb combined, max 6 unique fill colors
 */
function buildGraphicShape(
  el: GraphicElement,
  spec: DesignSpec,
  dims: { width: number; height: number }
): any | null {
  const rawColor =
    el.color === "accent"
      ? spec.palette.accent
      : el.color === "primary"
      ? spec.palette.primary
      : spec.palette.secondary;

  // Simulate opacity by blending with background
  const color = el.opacity < 1
    ? blendColors(rawColor, spec.palette.background, el.opacity)
    : rawColor;

  const x = pct(el.position.x, dims.width);
  const y = pct(el.position.y, dims.height);
  const w = Math.max(1, pct(el.position.width, dims.width));

  // Keep shapes simple and valid for Canva's strict SVG path requirements
  if (el.type === "horizontal_rule") {
    const h = 4;
    return {
      type: "shape" as const,
      top: y,
      left: x,
      width: w,
      height: h,
      viewBox: { top: 0, left: 0, width: w, height: h },
      paths: [
        {
          d: `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
          fill: { color },
        },
      ],
    };
  }

  if (el.type === "side_bar") {
    const barW = Math.max(4, Math.round((1.2 / 100) * dims.width));
    const h = dims.height;
    return {
      type: "shape" as const,
      top: 0,
      left: x,
      width: barW,
      height: h,
      viewBox: { top: 0, left: 0, width: barW, height: h },
      paths: [
        {
          d: `M 0 0 L ${barW} 0 L ${barW} ${h} L 0 ${h} Z`,
          fill: { color },
        },
      ],
    };
  }

  if (el.type === "background_shape") {
    const h = w; // Square
    return {
      type: "shape" as const,
      top: y,
      left: x,
      width: w,
      height: h,
      viewBox: { top: 0, left: 0, width: w, height: h },
      paths: [
        {
          d: `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`,
          fill: { color },
        },
      ],
    };
  }

  if (el.type === "corner_tag") {
    return {
      type: "shape" as const,
      top: y,
      left: x,
      width: w,
      height: w,
      viewBox: { top: 0, left: 0, width: w, height: w },
      paths: [
        {
          d: `M 0 0 L ${w} 0 L 0 ${w} Z`,
          fill: { color },
        },
      ],
    };
  }

  if (el.type === "slash_divider") {
    // Thin diagonal parallelogram rendered as a "/" slash across the element width.
    // 20px fixed slant keeps it visually consistent regardless of element width.
    const slant = 20;
    const thickness = 3;
    const h = slant + thickness;
    return {
      type: "shape" as const,
      top: y,
      left: x,
      width: w,
      height: h,
      viewBox: { top: 0, left: 0, width: w, height: h },
      paths: [
        {
          d: `M 0 0 L ${w - slant} 0 L ${w} ${h} L ${slant} ${h} Z`,
          fill: { color },
        },
      ],
    };
  }

  // For circle_accent, dot_grid — approximate with a diamond shape
  // (Canva paths can't use arc commands reliably, so we use an octagon approximation)
  if (el.type === "circle_accent" || el.type === "dot_grid") {
    const r = w / 2;
    // Approximate circle with octagon
    const p = (n: number) => Math.round(n * 100) / 100;
    const cos45 = 0.7071;
    const pts = [
      [r, 0],
      [r + r * cos45, r - r * cos45],
      [w, r],
      [r + r * cos45, r + r * cos45],
      [r, w],
      [r - r * cos45, r + r * cos45],
      [0, r],
      [r - r * cos45, r - r * cos45],
    ];
    const d =
      `M ${p(pts[0][0])} ${p(pts[0][1])} ` +
      pts
        .slice(1)
        .map(([px, py]) => `L ${p(px)} ${p(py)}`)
        .join(" ") +
      " Z";

    return {
      type: "shape" as const,
      top: y,
      left: x,
      width: w,
      height: w,
      viewBox: { top: 0, left: 0, width: w, height: w },
      paths: [{ d, fill: { color } }],
    };
  }

  // Default: simple rectangle
  return {
    type: "shape" as const,
    top: y,
    left: x,
    width: w,
    height: w,
    viewBox: { top: 0, left: 0, width: w, height: w },
    paths: [
      {
        d: `M 0 0 L ${w} 0 L ${w} ${w} L 0 ${w} Z`,
        fill: { color },
      },
    ],
  };
}

/**
 * Add text elements (label, heading, body) to the current page.
 */
async function addTextElements(
  spec: DesignSpec,
  slide: SlideSpec,
  dims: { width: number; height: number },
  scale: number
): Promise<void> {
  // Label
  if (slide.label && slide.layout.labelPosition) {
    try {
      await addElementAtPoint({
        type: "text",
        children: [slide.label],
        top: pct(slide.layout.labelPosition.y, dims.height),
        left: pct(slide.layout.labelPosition.x, dims.width),
        width: pct(slide.layout.labelPosition.width, dims.width),
        fontSize: clampFontSize(16 * scale),
        fontWeight: mapWeight(spec.typography.accent.fontWeight),
        color: spec.palette.accent,
        textAlign: mapTextAlign(slide.layout.textAlign),
      });
    } catch (e) {
      console.warn("Failed to add label text:", e);
    }
  }

  // Heading
  try {
    await addElementAtPoint({
      type: "text",
      children: [slide.heading],
      top: pct(slide.layout.headingPosition.y, dims.height),
      left: pct(slide.layout.headingPosition.x, dims.width),
      width: pct(slide.layout.headingPosition.width, dims.width),
      fontSize: clampFontSize(slide.layout.headingFontSize * scale),
      fontWeight: mapWeight(spec.typography.heading.fontWeight),
      color: spec.palette.primary,
      textAlign: mapTextAlign(slide.layout.textAlign),
    });
  } catch (e) {
    console.warn("Failed to add heading text:", e);
  }

  // Body
  if (slide.body && slide.layout.bodyPosition) {
    try {
      await addElementAtPoint({
        type: "text",
        children: [slide.body],
        top: pct(slide.layout.bodyPosition.y, dims.height),
        left: pct(slide.layout.bodyPosition.x, dims.width),
        width: pct(slide.layout.bodyPosition.width, dims.width),
        fontSize: clampFontSize(slide.layout.bodyFontSize * scale),
        fontWeight: mapWeight(spec.typography.body.fontWeight),
        color: spec.palette.secondary,
        textAlign: mapTextAlign(slide.layout.textAlign),
      });
    } catch (e) {
      console.warn("Failed to add body text:", e);
    }
  }
}

// --- HELPERS ---

/** Convert percentage to pixels relative to a dimension */
function pct(percent: number, dimension: number): number {
  return Math.round((percent / 100) * dimension);
}

/** Canva fontSize limit. If > 100 on Canva, it might throw, but often it lets up to 1000 now. We'll clamp to 400. */
function clampFontSize(size: number): number {
  return Math.max(1, Math.min(400, Math.round(size)));
}

/** Map weight strings to Canva's FontWeight enum */
function mapWeight(
  weight: string | number
): "normal" | "thin" | "extralight" | "light" | "medium" | "semibold" | "bold" | "ultrabold" | "heavy" {
  const w = String(weight);
  if (w === "700" || w === "800" || w === "bold") return "bold";
  if (w === "900" || w === "heavy" || w === "black") return "heavy";
  if (w === "600" || w === "semibold") return "semibold";
  if (w === "500" || w === "medium") return "medium";
  if (w === "300" || w === "light") return "light";
  if (w === "200" || w === "extralight") return "extralight";
  if (w === "100" || w === "thin") return "thin";
  return "normal";
}

/** Map our textAlign to Canva's TextAlign */
function mapTextAlign(align: string): "start" | "center" | "end" {
  if (align === "right") return "end";
  if (align === "center") return "center";
  return "start";
}

/** Blend foreground color with background at given opacity */
function blendColors(fgHex: string, bgHex: string, opacity: number): string {
  if (opacity >= 1) return fgHex;
  if (opacity <= 0) return bgHex;

  const parseHex = (hex: string) => {
    const h = hex.replace(/^#/, "");
    return {
      r: parseInt(h.substring(0, 2), 16) || 0,
      g: parseInt(h.substring(2, 4), 16) || 0,
      b: parseInt(h.substring(4, 6), 16) || 0,
    };
  };

  const fg = parseHex(fgHex);
  const bg = parseHex(bgHex);

  const r = Math.round(fg.r * opacity + bg.r * (1 - opacity));
  const g = Math.round(fg.g * opacity + bg.g * (1 - opacity));
  const b = Math.round(fg.b * opacity + bg.b * (1 - opacity));

  const toHex = (c: number) => {
    const hex = Math.min(255, Math.max(0, c)).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
