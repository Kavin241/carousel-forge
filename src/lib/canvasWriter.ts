import {
  getCurrentPageContext,
  addNativeElement,
  setCurrentPageBackground,
  addPage
} from '@canva/design';
import { DesignSpec, SlideSpec, GraphicElement } from './types';

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
      type: 'text',
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
    type: 'text',
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
      type: 'text',
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
      fill: { type: 'SOLID', color: spec.palette.background }
    });
  } else if (spec.backgroundStyle === 'gradient' && spec.gradientConfig) {
    await setCurrentPageBackground({
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
        type: 'shape',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'side_bar':
      await addNativeElement({
        type: 'shape',
        pageIndex,
        top: 0, left: x, width: pct(1.2), height: CANVAS_SIZE,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'circle_accent':
      await addNativeElement({
        type: 'shape',
        pageIndex,
        shapeType: 'ellipse',
        top: y, left: x, width: w, height: w,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'corner_tag':
      await addNativeElement({
        type: 'shape',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      // Vertical part of corner
      await addNativeElement({
        type: 'shape',
        pageIndex,
        top: y, left: x, width: 2, height: w,
        fill: { type: 'SOLID', color },
        opacity: el.opacity
      });
      break;

    case 'background_shape':
      await addNativeElement({
        type: 'shape',
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
            type: 'shape',
            pageIndex,
            shapeType: 'ellipse',
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
        type: 'shape',
        pageIndex,
        top: y, left: x, width: w, height: 2,
        fill: { type: 'SOLID', color },
        opacity: el.opacity,
        rotation: -15
      });
      break;
  }
}
