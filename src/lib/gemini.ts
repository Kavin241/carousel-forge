import { DesignSpec } from './types';

const API_URL = import.meta.env.VITE_API_PROXY_URL || '/api/generate-design';

export async function callGemini(prompt: string): Promise<string> {
  // Use absolute URL if provided (required for Canva production)
  const isCanva = window.location.hostname.includes('canva.com') || window.location.hostname.includes('canva-apps.com');
  const finalUrl = (isCanva && import.meta.env.VITE_API_PROXY_URL) 
    ? import.meta.env.VITE_API_PROXY_URL 
    : '/api/generate-design';

  const response = await fetch(finalUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: prompt,
      model: import.meta.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash'
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || `Proxy error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.result) throw new Error('Empty result from server');
  return data.result;
}

export async function parseDesignSpec(raw: string): Promise<DesignSpec> {
  // Strip any accidental markdown fences
  let cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // FIX: Handle literal newlines inside strings which break JSON.parse
  // This looks for newlines that are NOT preceded by a backslash but are inside double quotes.
  // A simpler version: just replace all actual newlines with escaped ones if they appear between quotes.
  cleaned = cleaned.replace(/"([^"]*)"/g, (match, content) => {
    return '"' + content.replace(/\n/g, '\\n') + '"';
  });

  // Fix other common Gemini JSON issues:
  // 1. Remove trailing commas before } or ]
  cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
  // 2. Remove single-line comments
  cleaned = cleaned.replace(/\/\/[^\n]*/g, '');

  try {
    return JSON.parse(cleaned) as DesignSpec;
  } catch (firstError) {
    // Second attempt: more aggressive cleanup for single quotes used as delimiters
    try {
      const aggressive = cleaned
        .replace(/'/g, '"')
        .replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(aggressive) as DesignSpec;
    } catch (secondError) {
      console.error('Final JSON Parse Failure. Raw:', raw);
      throw new Error(`Failed to parse Gemini response: ${firstError}`);
    }
  }
}
