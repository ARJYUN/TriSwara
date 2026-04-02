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

export async function extractSwarasFromImage(
  base64Image: string,
  mimeType: string,
  apiKey: string
): Promise<string[][]> {
  // Uses Vite proxy /claude-api → https://api.anthropic.com to bypass browser CORS
  const response = await fetch("/claude-api/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: "text",
              text: "Extract all swaras from this image. Return only the JSON array.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const msg = (err as { error?: { message?: string } })?.error?.message || response.statusText;
    throw new Error(`Claude API error: ${msg}`);
  }

  const data = await response.json();
  const raw = (data.content as { type: string; text?: string }[])
    .map((b) => b.text || "")
    .join("");

  // Strip any accidental markdown code fences
  const clean = raw.replace(/```json|```/g, "").trim();

  try {
    return JSON.parse(clean) as string[][];
  } catch {
    throw new Error("Claude returned invalid JSON. The image may be unclear or not contain Carnatic notation.");
  }
}
