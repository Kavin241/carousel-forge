import { callGemini } from '../src/lib/gemini';

const REFRESH_PROMPT = `
You are a social media design trend analyst. Based on current viral carousel trends from Instagram, TikTok, and LinkedIn (educational content, as of 2025-2026), generate 3 new design vibe presets that are trending RIGHT NOW but not yet mainstream.

Return a JSON array of 3 vibe objects. Each must follow the same structure as BASE_VIBES in the app. Only use fonts from this list: Montserrat, Raleway, Oswald, Nunito, Poppins, Work Sans, DM Sans, Plus Jakarta Sans, Outfit, Barlow, Urbanist, Jost, Manrope, Playfair Display, Cormorant Garamond, DM Serif Display, Libre Baskerville, Lora, Abril Fatface, Bebas Neue, Anton, Black Han Sans, Righteous, Bungee, Titan One, Space Mono, JetBrains Mono, Fira Code, Caveat, Pacifico.

Return ONLY a JSON array. No preamble.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST' && req.headers['x-vercel-cron'] !== '1') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const raw = await callGemini(REFRESH_PROMPT);
    const newVibes = JSON.parse(raw.replace(/```json\n?/g, '').replace(/```/g, '').trim());
    res.status(200).json({ vibes: newVibes, refreshedAt: new Date().toISOString() });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
}
