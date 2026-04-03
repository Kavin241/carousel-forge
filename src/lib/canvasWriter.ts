import {
  addElementAtPoint,
  setCurrentPageBackground,
  addPage,
  getDesignMetadata
} from '@canva/design';
import { DesignSpec, SlideSpec, GraphicElement } from './types';

// Default fallback, we'll get real ones from metadata
let DIMS = { width: 1080, height: 1080 };

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

function getSafeRect(x: number, y: number, w: number, h: number, margin = 5) {
  let targetX = (x / 100) * DIMS.width;
  let targetY = (y / 100) * DIMS.height;
  let targetW = (w / 100) * DIMS.width;
  let targetH = (h / 100) * DIMS.height;

  targetW = Math.min(targetW, DIMS.width - (margin * 2));
  targetH = Math.min(targetH, DIMS.height - (margin * 2));
  targetX = Math.max(margin, Math.min(targetX, DIMS.width - targetW - margin));
  targetY = Math.max(margin, Math.min(targetY, DIMS.height - targetH - margin));

  return { left: targetX, top: targetY, width: targetW, height: targetH };
}

function buildElementList(spec: DesignSpec, slide: SlideSpec): any[] {
  const elements: any[] = [];

  // 1. Add graphic elements
  for (const el of spec.graphicElements) {
    const color = el.color === 'accent' ? spec.palette.accent
      : el.color === 'primary' ? spec.palette.primary
      : spec.palette.secondary;
    
    const rect = getSafeRect(el.position.x, el.position.y, el.position.width, el.position.width);

    if (el.type === 'horizontal_rule') {
      elements.push({
        type: 'shape',
        top: rect.top, left: rect.left, width: rect.width, height: 3,
        viewBox: { top: 0, left: 0, width: rect.width, height: 3 },
        paths: [{ d: `M 0 1.5 L ${rect.width} 1.5`, fill: { color }, stroke: { color, weight: 0.1 } }],
      });
    } else if (el.type === 'side_bar') {
      const barW = (1.2 / 100) * DIMS.width;
      elements.push({
        type: 'shape',
        top: 0, left: rect.left, width: barW, height: DIMS.height,
        viewBox: { top: 0, left: 0, width: barW, height: DIMS.height },
        paths: [{ d: `M 0 0 L ${barW} 0 L ${barW} ${DIMS.height} L 0 ${DIMS.height} Z`, fill: { color } }],
      });
    } else {
      elements.push({
        type: 'shape',
        ...rect,
        viewBox: { top: 0, left: 0, width: rect.width, height: rect.width },
        paths: [{ d: `M 0 0 L ${rect.width} 0 L ${rect.width} ${rect.width} L 0 ${rect.width} Z`, fill: { color } }],
      });
    }
  }

  // 2. Add Texts
  if (slide.label && slide.layout.labelPosition) {
    elements.push({
      type: 'text',
      ...getSafeRect(slide.layout.labelPosition.x, slide.layout.labelPosition.y, slide.layout.labelPosition.width, 5),
      children: [slide.label],
      fontSize: 16,
      fontWeight: mapWeight(spec.typography.accent.fontWeight),
      color: spec.palette.accent,
      textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
    });
  }

  elements.push({
    type: 'text',
    ...getSafeRect(slide.layout.headingPosition.x, slide.layout.headingPosition.y, slide.layout.headingPosition.width, 10),
    children: [slide.heading],
    fontSize: Math.min(slide.layout.headingFontSize, 100),
    fontWeight: mapWeight(spec.typography.heading.fontWeight),
    color: spec.palette.primary,
    textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
  });

  if (slide.body && slide.layout.bodyPosition) {
    elements.push({
      type: 'text',
      ...getSafeRect(slide.layout.bodyPosition.x, slide.layout.bodyPosition.y, slide.layout.bodyPosition.width, 20),
      children: [slide.body],
      fontSize: Math.min(slide.layout.bodyFontSize, 100),
      fontWeight: mapWeight(spec.typography.body.fontWeight),
      color: spec.palette.secondary,
      textAlign: slide.layout.textAlign === 'left' ? 'start' : slide.layout.textAlign === 'right' ? 'end' : 'center',
    });
  }

  return elements;
}

export async function applyDesignToCanvas(
  spec: DesignSpec,
  mode: 'restyle' | 'build',
  existingPageCount: number
): Promise<void> {
  // Sync dimensions from metadata (v2 best practice)
  const meta = await getDesignMetadata();
  if (meta && meta.dimensions) {
    DIMS = { width: meta.dimensions.width, height: meta.dimensions.height };
  }

  // 1. Handle Slide 1 on the CURRENT page
  if (spec.slides.length > 0) {
    await setCurrentPageBackground({ color: spec.palette.background });
    const slide1Elements = buildElementList(spec, spec.slides[0]);
    for (const el of slide1Elements) {
      await addElementAtPoint(el);
    }
  }

  // 2. Add subsequent slides as new pages WITH content
  for (let i = 1; i < spec.slides.length; i++) {
    const pageElements = buildElementList(spec, spec.slides[i]);
    await addPage({
      background: { color: spec.palette.background },
      elements: pageElements as any,
    });
  }
}
