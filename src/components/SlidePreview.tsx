import React from 'react';
import { ExtractedSlide } from '../lib/types';

interface SlidePreviewProps {
  slides: ExtractedSlide[];
  onToggle: (pageIndex: number) => void;
}

export function SlidePreview({ slides, onToggle }: SlidePreviewProps) {
  return (
    <div className="slide-preview-list">
      {slides.map(slide => (
        <div key={slide.pageIndex} className="slide-preview-item">
          <input 
            type="checkbox" 
            checked={slide.include} 
            onChange={() => onToggle(slide.pageIndex)}
          />
          <div className="slide-preview-text">
            <div className="slide-preview-heading">Slide {slide.pageIndex + 1}</div>
            <div>
              {slide.textBlocks.slice(0, 2).map((tb, i) => (
                <span key={i}>{tb.text.substring(0, 40)}{tb.text.length > 40 ? '...' : ''} </span>
              ))}
              {slide.textBlocks.length > 2 && '...'}
            </div>
            {slide.textBlocks.length === 0 && <span>No text found.</span>}
          </div>
        </div>
      ))}
    </div>
  );
}
