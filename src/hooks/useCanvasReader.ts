import { useState, useCallback } from 'react';
import { ExtractedSlide } from '../lib/types';
import { readAllSlides } from '../lib/canvasReader';

export function useCanvasReader() {
  const [extractedSlides, setExtractedSlides] = useState<ExtractedSlide[] | null>(null);

  const refreshSlides = useCallback(async () => {
    try {
      const slides = await readAllSlides();
      setExtractedSlides(slides);
      return slides;
    } catch (e) {
      console.error('Failed to read canvas slides', e);
      return [];
    }
  }, []);

  const toggleSlide = useCallback((pageIndex: number) => {
    setExtractedSlides(prev => {
      if (!prev) return prev;
      return prev.map(s => s.pageIndex === pageIndex ? { ...s, include: !s.include } : s);
    });
  }, []);

  return { extractedSlides, toggleSlide, refreshSlides };
}
