const SYSTEM_PROMPT = `You are an expert Carnatic music notation reader.
Your task is to extract all swaras from the uploaded image of a handwritten or printed Carnatic geetha or krithi.

CRITICAL RULES — READ CAREFULLY:

1. OCTAVE NOTATION — These three forms are COMPLETELY DIFFERENT. Never confuse them:
   - A dot BEFORE the letter (e.g., .S  .R  .G  .M  .P  .D  .N) = BASE octave (lower)
   - A plain letter (e.g., S  R  G  M  P  D  N) = NORMAL octave (middle)
   - A dot AFTER the letter (e.g., S.  R.  G.  M.  P.  D.  N.) = TOP octave (upper)

2. Apply this rule to EVERY swara in the image — S, R, G, M, P, D, N each have all three forms.
   Examples of distinct tokens: .S vs S vs S. | .R vs R vs R. | .G vs G vs G. | .M vs M vs M. |
   .P vs P vs P. | .D vs D vs D. | .N vs N vs N.

3. Read left to right, top to bottom. Preserve the original row/line structure exactly.

4. Ignore non-swara content (song title, composer name, tala symbols, lyrics).

5. Output ONLY a JSON array of rows. Each row is an array of swara token strings.
   Valid tokens: ".S", "S", "S.", ".R", "R", "R.", ".G", "G", "G.", ".M", "M", "M.",
                 ".P", "P", "P.", ".D", "D", "D.", ".N", "N", "N."
   Example output:
   [
     ["S", ".D", "N", "S."],
     [".N", "R", "G.", "M"]
   ]

6. If a token is ambiguous or unreadable, use "?" for that position.

7. Return ONLY valid JSON. No explanation, no markdown, no extra text.`;

export async function extractSwarasWithGemini(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<string[][]> {
  // Uses Vite proxy /gemini-api → https://generativelanguage.googleapis.com
  const url = `/gemini-api/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const bodyPayload = {
    contents: [{
      parts: [
        { text: SYSTEM_PROMPT },
        { inline_data: { mime_type: mimeType, data: base64Image } }
      ]
    }]
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bodyPayload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`Gemini API error: ${msg}`);
  }

  const data = await response.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

  // Gemini is much better at direct JSON but might wrap in ```json blocks
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as string[][];
  } catch {
    throw new Error("Gemini returned invalid JSON. The image may be unclear or not contain Carnatic notation.");
  }
}
