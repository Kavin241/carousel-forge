import { getCurrentPageContext } from '@canva/design';
import { ExtractedSlide, ExtractedTextBlock } from './types';

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
