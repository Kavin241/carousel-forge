import {
  addElementAtPoint,
  setCurrentPageBackground,
  addPage
} from '@canva/design';
import { DesignSpec, SlideSpec, GraphicElement } from './types';

const CANVAS_SIZE = 1080; // All operations in 1080x1080 space

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

// Convert percentage position to pixel values
function pct(val: number): number {
  return (val / 100) * CANVAS_SIZE;
}

export async function applyDesignToCanvas(
  spec: DesignSpec,
  mode: 'restyle' | 'build',
  existingPageCount: number
): Promise<void> {
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
    await addElementAtPoint({
      type: 'text',
      top: pct(slide.layout.labelPosition.y),
      left: pct(slide.layout.labelPosition.x),
      width: pct(slide.layout.labelPosition.width),
      children: [slide.label],
      fontSize: 16,
      fontWeight: mapWeight(spec.typography.accent.fontWeight),
      color: spec.palette.accent,
      textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
    });
  }

  await addElementAtPoint({
    type: 'text',
    top: pct(slide.layout.headingPosition.y),
    left: pct(slide.layout.headingPosition.x),
    width: pct(slide.layout.headingPosition.width),
    children: [slide.heading],
    fontSize: slide.layout.headingFontSize,
    fontWeight: mapWeight(spec.typography.heading.fontWeight),
    color: spec.palette.primary,
    textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
  });

  if (slide.body && slide.layout.bodyPosition) {
    await addElementAtPoint({
      type: 'text',
      top: pct(slide.layout.bodyPosition.y),
      left: pct(slide.layout.bodyPosition.x),
      width: pct(slide.layout.bodyPosition.width),
      children: [slide.body],
      fontSize: slide.layout.bodyFontSize,
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

  const x = pct(el.position.x);
  const y = pct(el.position.y);
  const w = pct(el.position.width);

  switch (el.type) {
    case 'horizontal_rule':
      await addElementAtPoint({
        type: 'shape',
        top: y, left: x, width: w, height: 3,
        viewBox: { top: 0, left: 0, width: w, height: 3 },
        paths: [{ 
          d: `M 0 1.5 L ${w} 1.5`, 
          fill: { color },
          stroke: { color, weight: 0.1 } // Small weight to simulate v1 stroke
        }],
      });
      break;

    case 'side_bar':
      await addElementAtPoint({
        type: 'shape',
        top: 0, left: x, width: pct(1.2), height: CANVAS_SIZE,
        viewBox: { top: 0, left: 0, width: pct(1.2), height: CANVAS_SIZE },
        paths: [{ d: `M 0 0 L ${pct(1.2)} 0 L ${pct(1.2)} ${CANVAS_SIZE} L 0 ${CANVAS_SIZE} Z`, fill: { color } }],
      });
      break;

    case 'circle_accent':
    case 'background_shape':
    case 'corner_tag':
    case 'dot_grid':
    case 'slash_divider':
      await addElementAtPoint({
        type: 'shape',
        top: y, left: x, width: w, height: w,
        viewBox: { top: 0, left: 0, width: w, height: w },
        paths: [{ d: `M 0 0 L ${w} 0 L ${w} ${w} L 0 ${w} Z`, fill: { color } }],
      });
      break;
  }
}
