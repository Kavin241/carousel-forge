import {
  addElementAtPoint,
  setCurrentPageBackground,
  addPage,
  getDefaultPageDimensions
} from '@canva/design';
import { DesignSpec, SlideSpec, GraphicElement } from './types';

// Default fallback, but we'll try to get real ones
let DIMS = { width: 1080, height: 1080 };

// Helper to map numeric weights to Canva Weight strings
function mapWeight(weight: string | number): "normal" | "thin" | "extralight" | "light" | "medium" | "semibold" | "bold" | "ultrabold" | "heavy" {
  const w = String(weight);
  if (w === '700' || w === '800' || w === 'bold') return 'bold';
  if (w === '900' || w === 'heavy' || w === 'black') return 'heavy';
  if (w === '600' || w === 'semibold') return 'semibold';
  if (w === '500' || w === 'medium') return 'medium';
  if (w === '300' || w === 'light') return 'light';
  if (w === '200' || w === 'extralight') return 'extralight';
  if (w === '100' || w === 'thin') return 'thin';
  return 'normal';
}

// Convert percentage position to pixel values based on REAL dimensions
function getSafeRect(x: number, y: number, w: number, h: number, margin = 2) {
  // 1. Convert percents to pixels
  let targetX = (x / 100) * DIMS.width;
  let targetY = (y / 100) * DIMS.height;
  let targetW = (w / 100) * DIMS.width;
  let targetH = (h / 100) * DIMS.height;

  // 2. Clamp width/height to never exceed page
  targetW = Math.min(targetW, DIMS.width - (margin * 2));
  targetH = Math.min(targetH, DIMS.height - (margin * 2));

  // 3. Constrain position to keep element inside
  targetX = Math.max(margin, Math.min(targetX, DIMS.width - targetW - margin));
  targetY = Math.max(margin, Math.min(targetY, DIMS.height - targetH - margin));

  return { left: targetX, top: targetY, width: targetW, height: targetH };
}

export async function applyDesignToCanvas(
  spec: DesignSpec,
  mode: 'restyle' | 'build',
  existingPageCount: number
): Promise<void> {
  // Sync dimensions
  const dims = await getDefaultPageDimensions();
  if (dims) {
    DIMS = { width: dims.width, height: dims.height };
  }

  // Apply first slide to the current page
  if (spec.slides.length > 0) {
    await applySlide(spec, spec.slides[0]);
  }

  // Add remaining slides as new pages
  for (let i = 1; i < spec.slides.length; i++) {
    await addPage({
      background: { color: spec.palette.background },
    });
    // After addPage, the new page becomes the current page
    await applySlideToCurrentPage(spec, spec.slides[i]);
  }
}

async function applySlideToCurrentPage(
  spec: DesignSpec,
  slide: SlideSpec,
): Promise<void> {
  for (const el of spec.graphicElements) {
    await addGraphicElement(el, spec);
  }

  if (slide.label && slide.layout.labelPosition) {
    const rect = getSafeRect(
      slide.layout.labelPosition.x,
      slide.layout.labelPosition.y,
      slide.layout.labelPosition.width,
      10 // Approx height for label
    );
    await addElementAtPoint({
      type: 'text',
      ...rect,
      children: [slide.label],
      fontSize: 16,
      fontWeight: mapWeight(spec.typography.accent.fontWeight),
      color: spec.palette.accent,
      textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
    });
  }

  // Heading - Needs safe height estimation
  const hRect = getSafeRect(
    slide.layout.headingPosition.x,
    slide.layout.headingPosition.y,
    slide.layout.headingPosition.width,
    slide.layout.headingFontSize * 1.5 / 10 // rough estimate
  );
  await addElementAtPoint({
    type: 'text',
    ...hRect,
    children: [slide.heading],
    fontSize: Math.min(slide.layout.headingFontSize, 100), // SDK Max is 100
    fontWeight: mapWeight(spec.typography.heading.fontWeight),
    color: spec.palette.primary,
    textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
  });

  if (slide.body && slide.layout.bodyPosition) {
    const bRect = getSafeRect(
      slide.layout.bodyPosition.x,
      slide.layout.bodyPosition.y,
      slide.layout.bodyPosition.width,
      slide.layout.bodyFontSize * 5 / 10 // rough estimate for body block
    );
    await addElementAtPoint({
      type: 'text',
      ...bRect,
      children: [slide.body],
      fontSize: Math.min(slide.layout.bodyFontSize, 100),
      fontWeight: mapWeight(spec.typography.body.fontWeight),
      color: spec.palette.secondary,
      textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
    });
  }
}

async function applySlide(
  spec: DesignSpec,
  slide: SlideSpec
): Promise<void> {
  await setCurrentPageBackground({ color: spec.palette.background });
  await applySlideToCurrentPage(spec, slide);
}

async function addGraphicElement(
  el: GraphicElement,
  spec: DesignSpec,
): Promise<void> {
  const color = el.color === 'accent' ? spec.palette.accent
    : el.color === 'primary' ? spec.palette.primary
    : spec.palette.secondary;

  const rect = getSafeRect(el.position.x, el.position.y, el.position.width, el.position.width);

  switch (el.type) {
    case 'horizontal_rule':
      await addElementAtPoint({
        type: 'shape',
        top: rect.top, left: rect.left, width: rect.width, height: 3,
        viewBox: { top: 0, left: 0, width: rect.width, height: 3 },
        paths: [{ d: `M 0 1.5 L ${rect.width} 1.5`, fill: { color }, stroke: { color, weight: 0.1 } }],
      });
      break;

    case 'side_bar':
      const barW = (1.2 / 100) * DIMS.width;
      await addElementAtPoint({
        type: 'shape',
        top: 0, left: rect.left, width: barW, height: DIMS.height,
        viewBox: { top: 0, left: 0, width: barW, height: DIMS.height },
        paths: [{ d: `M 0 0 L ${barW} 0 L ${barW} ${DIMS.height} L 0 ${DIMS.height} Z`, fill: { color } }],
      });
      break;

    case 'circle_accent':
    case 'background_shape':
    case 'corner_tag':
    case 'dot_grid':
    case 'slash_divider':
      await addElementAtPoint({
        type: 'shape',
        ...rect,
        height: rect.width,
        viewBox: { top: 0, left: 0, width: rect.width, height: rect.width },
        paths: [{ d: `M 0 0 L ${rect.width} 0 L ${rect.width} ${rect.width} L 0 ${rect.width} Z`, fill: { color } }],
      });
      break;
  }
}
