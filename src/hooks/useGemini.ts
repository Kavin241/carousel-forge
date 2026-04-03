import { useState } from 'react';
import { DesignSpec, LockState, ExtractedSlide } from '../lib/types';
import { callGemini, parseDesignSpec } from '../lib/gemini';
import { buildDesignPrompt } from '../lib/promptBuilder';

export function useGemini() {
  const [designSpec, setDesignSpec] = useState<DesignSpec | null>(null);

  const generateDesign = async (params: {
    mode: 'build' | 'restyle';
    script: string | null;
    vibePrompt: string | null;
    existingSlides: ExtractedSlide[] | null;
    lockedElements: LockState;
    shuffleTarget: keyof LockState | 'all' | null;
  }) => {
    const prompt = buildDesignPrompt({ ...params, currentSpec: designSpec });
    const rawResult = await callGemini(prompt);
    const spec = await parseDesignSpec(rawResult);
    setDesignSpec(spec);
    return spec;
  };

  const shuffleElements = async (target: keyof LockState | 'all', params: {
    mode: 'build' | 'restyle';
    script: string | null;
    vibePrompt: string | null;
    existingSlides: ExtractedSlide[] | null;
    lockedElements: LockState;
  }) => {
    return generateDesign({ ...params, shuffleTarget: target });
  };

  return { designSpec, generateDesign, shuffleElements };
}
