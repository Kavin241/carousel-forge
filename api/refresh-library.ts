const callGemini = async (prompt: string): Promise<string> => {
  const apiKey = process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`;
  const response = await fetch(`${endpoint}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.85, topK: 40, topP: 0.95, maxOutputTokens: 4096 }
    })
  });
  if (!response.ok) throw new Error(`Gemini error: ${response.statusText}`);
  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) throw new Error('Empty response from Gemini');
  return raw;
};

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
