export default async function handler(req: any, res: any) {
  // 1. CORS headers (CRITICAL for Canva)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // For dev, allow all. You can restrict to *.canva.com later.
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { prompt, model } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: 'No prompt provided' });
  }

  // 3. SECURE KEY: Stored in Vercel backend environment
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key not configured on server. Please set GEMINI_API_KEY in your .env or Vercel dashboard.' });
  }

  // 4. Hit Google AI API (using the verified 2.5-flash)
  const targetModel = model || 'gemini-2.5-flash';
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent`;

  try {
    const response = await fetch(`${endpoint}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.85,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192, // Support longer carousel specs
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ 
        error: `Gemini Error: ${err.error?.message || response.statusText}` 
      });
    }

    const data = await response.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!raw) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    return res.status(200).json({ result: raw });

  } catch (e: any) {
    console.error('Server Proxy Error:', e);
    return res.status(500).json({ error: e.message });
  }
}
