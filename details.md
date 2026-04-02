# 🎵 Harmonic Swaras — Master Build Prompt

> A Carnatic music web application for AI-powered swara sheet conversion and harmonic multi-layer studio recording.

---

## Project Overview

Build a full-stack web application called **"Harmonic Swaras"** with two core modules:

1. **Swara Sheet Converter** — Upload an image of a Carnatic geetha/krithi, extract all swaras using AI vision, and auto-generate the corresponding **Base** and **Top** harmonic swara sheets using the 7th-interval rule.
2. **Harmonic Studio** — Record, trim, and mix three layers (Base / Normal / Top) of a musical performance and play them simultaneously as a harmonious blend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite (TypeScript) |
| Styling | Tailwind CSS + custom CSS variables |
| AI Vision (OCR) | Claude `claude-sonnet-4-20250514` via Anthropic API (`/v1/messages`) with vision input |
| Audio Engine | Web Audio API + MediaRecorder API |
| State Management | React `useState` / `useReducer` |
| File Handling | FileReader API (base64 encode images for Claude) |
| Build / Deploy | Vite + Netlify or Vercel |

---

## The Complete Swara Scale

The full Carnatic scale used in this application spans three octaves, ordered as follows (left to right = low to high):

```
Position:  1    2    3    4    5    6    7    8    9    10   11   12   13   14   15   16   17   18   19   20   21
Swara:    .R   .G   .M   .P   .D   .N    S    R    G    M    P    D    N   S.   R.   G.   M.   P.   D.   N.  [S..]
```

**Octave Notation Rules (CRITICAL):**
- A dot **below** the letter (e.g., `.S`, `.R`, `.G`, `.M`, `.P`, `.D`, `.N`) = **Base octave** (lower)
- A plain letter (e.g., `S`, `R`, `G`, `M`, `P`, `D`, `N`) = **Normal octave** (middle)
- A dot **above/after** the letter (e.g., `S.`, `R.`, `G.`, `M.`, `P.`, `D.`, `N.`) = **Top octave** (upper)

These three representations are **completely distinct** and must never be confused.

---

## Harmonic Mapping Rule

For any given **Normal** swara at position `X` in the full scale:

- **Base note** = the swara **7 positions back** from X in the full scale
- **Top note** = the swara **7 positions forward** from X in the full scale

This rule applies uniformly to ALL swaras including base-octave (`.X`) and top-octave (`X.`) inputs.

---

## Complete Harmonic Mapping Table

```javascript
// Full ordered scale (index 0 to 20)
const FULL_SCALE = [
  ".R",  // 0
  ".G",  // 1
  ".M",  // 2
  ".P",  // 3
  ".D",  // 4
  ".N",  // 5
  "S",   // 6
  "R",   // 7
  "G",   // 8
  "M",   // 9
  "P",   // 10
  "D",   // 11
  "N",   // 12
  "S.",  // 13
  "R.",  // 14
  "G.",  // 15
  "M.",  // 16
  "P.",  // 17
  "D.",  // 18
  "N.",  // 19
  "S.." // 20  (implied top, for overflow)
];

// Mapping: for each swara, base = index - 7, top = index + 7
// If index - 7 < 0 or index + 7 > 20, mark as "--" (out of defined range)

const SWARA_MAP = {
  //  Swara   Index   Base (idx-7)   Top (idx+7)
  ".R":  { base: "--",  normal: ".R",  top: ".N"  }, // idx 0: base OOB
  ".G":  { base: "--",  normal: ".G",  top: "S"   }, // idx 1: base OOB
  ".M":  { base: "--",  normal: ".M",  top: "R"   }, // idx 2: base OOB
  ".P":  { base: "--",  normal: ".P",  top: "G"   }, // idx 3: base OOB
  ".D":  { base: "--",  normal: ".D",  top: "M"   }, // idx 4: base OOB
  ".N":  { base: "--",  normal: ".N",  top: "P"   }, // idx 5: base OOB
  "S":   { base: ".R",  normal: "S",   top: "D"   }, // idx 6
  "R":   { base: ".G",  normal: "R",   top: "N"   }, // idx 7
  "G":   { base: ".M",  normal: "G",   top: "S."  }, // idx 8
  "M":   { base: ".P",  normal: "M",   top: "R."  }, // idx 9
  "P":   { base: ".D",  normal: "P",   top: "G."  }, // idx 10
  "D":   { base: ".N",  normal: "D",   top: "M."  }, // idx 11
  "N":   { base: "S",   normal: "N",   top: "P."  }, // idx 12
  "S.":  { base: "R",   normal: "S.",  top: "D."  }, // idx 13
  "R.":  { base: "G",   normal: "R.",  top: "N."  }, // idx 14
  "G.":  { base: "M",   normal: "G.",  top: "S.." }, // idx 15
  "M.":  { base: "P",   normal: "M.",  top: "--"  }, // idx 16: top OOB
  "P.":  { base: "D",   normal: "P.",  top: "--"  }, // idx 17: top OOB
  "D.":  { base: "N",   normal: "D.",  top: "--"  }, // idx 18: top OOB
  "N.":  { base: "S.",  normal: "N.",  top: "--"  }, // idx 19: top OOB
};
```

> **Note:** `"--"` means the harmonic note falls outside the defined scale range. Display these as `—` in the UI with a muted grey style and a tooltip: *"Out of scale range."*

---

## Window 1 — Swara Sheet Converter

### UI Layout

- **Left panel** — Image upload area (drag & drop or click to browse). Show preview thumbnail of uploaded image.
- **Right panel** — Three side-by-side columns labeled **Base**, **Normal**, **Top**, each displaying extracted and mapped swaras line by line (one row = one line from the original sheet).
- A **Convert** button triggers AI extraction and mapping.
- A **Download** button exports the three columns as a formatted `.txt` or `.pdf` file.

---

### AI Integration — Claude Vision

Send the uploaded image to Claude as a base64-encoded image. Use this exact system prompt:

```
You are an expert Carnatic music notation reader.
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

7. Return ONLY valid JSON. No explanation, no markdown, no extra text.
```

---

### Swara Mapping Logic (Frontend — `swaraMapper.ts`)

After receiving the JSON array from Claude, apply the `SWARA_MAP` table deterministically on the frontend:

```typescript
import { SWARA_MAP } from './swaraData';

export function mapToHarmonics(rows: string[][]): {
  base: string[][];
  normal: string[][];
  top: string[][];
} {
  const base: string[][] = [];
  const normal: string[][] = [];
  const top: string[][] = [];

  for (const row of rows) {
    const baseRow: string[] = [];
    const normalRow: string[] = [];
    const topRow: string[] = [];

    for (const token of row) {
      const mapped = SWARA_MAP[token];
      if (mapped) {
        baseRow.push(mapped.base);
        normalRow.push(mapped.normal);
        topRow.push(mapped.top);
      } else {
        // Unknown token — pass through with flag
        baseRow.push("?");
        normalRow.push(token);
        topRow.push("?");
      }
    }

    base.push(baseRow);
    normal.push(normalRow);
    top.push(topRow);
  }

  return { base, normal, top };
}
```

---

### Display & Rendering

- Each swara token is rendered as a small pill/chip element.
- Dot notation is rendered visually using CSS — **not** raw `.` characters:
  - Base (`.X`): subscript dot rendered via `::before` pseudo-element below the letter.
  - Top (`X.`): superscript dot rendered via `::after` pseudo-element above the letter.
- Color coding:
  - **Base** column → deep indigo (`#4338ca`)
  - **Normal** column → forest green (`#059669`)
  - **Top** column → golden amber (`#d97706`)
- Out-of-range tokens (`"--"`) → muted grey with tooltip: *"Out of scale range."*
- Unknown tokens (`"?"`) → yellow warning highlight with tooltip: *"Unrecognized — please verify."*

---

### Claude API Call Structure (`claudeVision.ts`)

```typescript
const SYSTEM_PROMPT = `...` // Full system prompt from above

export async function extractSwarasFromImage(
  base64Image: string,
  mimeType: string
): Promise<string[][]> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mimeType, data: base64Image }
          },
          {
            type: "text",
            text: "Extract all swaras from this image. Return only the JSON array."
          }
        ]
      }]
    })
  });

  const data = await response.json();
  const raw = data.content.map((b: any) => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}
```

---

## Window 2 — Harmonic Studio

### Layout

Three horizontal track lanes — **Base**, **Normal**, **Top** — each containing:

| Control | Description |
|---|---|
| **Record** button | Red dot icon — starts `MediaRecorder` with microphone input |
| **Stop** button | Stops the current recording |
| **Waveform visualizer** | Canvas element powered by Web Audio API `AnalyserNode`, drawn at 60fps |
| **Trim sliders** | Two `<input type="range">` sliders for start and end trim positions |
| **Volume slider** | Range 0–100%, controls individual track `GainNode` |
| **Play Preview** | Plays only this track with current trim and volume applied |

Below the three tracks:

| Control | Description |
|---|---|
| **▶ Play All** | Plays all three tracks simultaneously, tightly synchronized |
| **⏹ Stop All** | Stops all playback |
| **Master Volume** | Knob controlling the master `GainNode` |
| **⬇ Export Mix** | Renders the mix via `OfflineAudioContext`, downloads as `.wav` |

---

### Audio Engine Details (`audioEngine.ts`)

```
Recording:
  - getUserMedia({ audio: true }) for microphone access
  - MediaRecorder stores chunks as Blob → ArrayBuffer
  - AudioContext.decodeAudioData() decodes to AudioBuffer

Trimming:
  - Use AudioBuffer.copyFromChannel() to extract the selected time region
  - Create a new AudioBuffer of trimmed length and copy samples into it

Simultaneous Playback:
  - Create three AudioBufferSourceNode instances
  - Each connects to its own GainNode (individual volume)
  - All GainNodes connect to a master GainNode
  - master GainNode connects to AudioContext.destination
  - Call source.start(audioCtx.currentTime) for all three simultaneously
  - This achieves frame-accurate synchronization

Waveform Visualizer:
  - AnalyserNode inserted between source and gain
  - getByteTimeDomainData() polled in requestAnimationFrame loop
  - Drawn on <canvas> using Path2D for performance

Export Mix:
  - OfflineAudioContext with same graph topology
  - startRendering() returns rendered AudioBuffer
  - Manual WAV encoder: PCM 16-bit, 44100Hz stereo
  - Trigger browser download via Blob URL
```

---

## UI / UX Design Direction

| Property | Value |
|---|---|
| Theme | Dark, elegant, Carnatic music studio aesthetic |
| Background | Deep charcoal `#0f0f14` |
| Accent | Rich gold `#c9a84c` |
| Body text | Soft off-white `#e8e4dc` |
| Base color | Indigo `#4338ca` |
| Normal color | Emerald `#059669` |
| Top color | Amber `#d97706` |
| Heading font | `Cinzel` (Google Fonts) — classical Indian inscriptional feel |
| Swara token font | `Source Code Pro` — monospaced, precise |
| Layout | Two-panel tabbed interface: **"Converter"** tab and **"Studio"** tab |
| Tab transition | Smooth fade + slide animation (CSS transitions) |
| Loading state | Animated shimmer with veena silhouette SVG while Claude processes |
| Swara chip dots | CSS `::before` / `::after` pseudo-elements — never raw Unicode dots |
| Responsive | Optimized for tablet and desktop; mobile secondary |

---

## Error Handling & Edge Cases

| Scenario | Behavior |
|---|---|
| Claude cannot parse a token | Returns `"?"` — displayed in yellow with tooltip: *"Unrecognized notation — please verify."* |
| Token not found in `SWARA_MAP` | Passed through unchanged, flagged in orange |
| Poor image quality | Claude returns `{ "error": "Image unclear" }` — shown as a graceful error card in the UI |
| Harmonic note out of scale range | `"--"` displayed as `—` in muted grey with tooltip: *"Out of scale range."* |
| Microphone permission denied | Modal with step-by-step browser permission guide |
| Play All with no recordings | Toast: *"Please record at least one track before mixing."* |

---

## File Structure

```
harmonic-swaras/
├── src/
│   ├── components/
│   │   ├── ConverterWindow/
│   │   │   ├── ImageUploader.tsx       ← Drag & drop, preview
│   │   │   ├── SwaraColumn.tsx         ← Base / Normal / Top display grid
│   │   │   └── ConvertButton.tsx
│   │   ├── StudioWindow/
│   │   │   ├── TrackLane.tsx           ← Record + Trim + Volume per lane
│   │   │   ├── Waveform.tsx            ← Canvas waveform visualizer
│   │   │   └── MixControls.tsx         ← Play All / Export
│   │   └── shared/
│   │       ├── TabNav.tsx
│   │       └── Toast.tsx
│   ├── lib/
│   │   ├── claudeVision.ts             ← Anthropic API call with image
│   │   ├── swaraData.ts                ← FULL_SCALE array + SWARA_MAP object
│   │   ├── swaraMapper.ts              ← mapToHarmonics() function
│   │   └── audioEngine.ts              ← Web Audio API helpers
│   ├── App.tsx
│   └── main.tsx
├── public/
│   └── veena-silhouette.svg            ← Loading animation asset
└── vite.config.ts
```

---

## Deliverable Summary

| Feature | Implementation |
|---|---|
| Image upload + preview | FileReader API → base64 |
| AI swara extraction | Claude Vision API (`claude-sonnet-4-20250514`) |
| Full octave dot notation parsing | Claude system prompt with exhaustive rules for all 21 tokens |
| 7th-interval harmonic mapping | Frontend `SWARA_MAP` derived from `FULL_SCALE` index arithmetic |
| Out-of-range handling | `"--"` entries for positions 0–5 (base OOB) and 16–19 (top OOB) |
| Three-column swara display | Color-coded chips with CSS dot rendering |
| Audio recording | MediaRecorder + getUserMedia |
| Waveform visualizer | Web Audio API AnalyserNode + Canvas at 60fps |
| Trim controls | Dual range slider + AudioBuffer slicing |
| Simultaneous playback | Synchronized `AudioBufferSourceNode.start()` |
| Individual + master volume | GainNode per track + master GainNode |
| Mix export | OfflineAudioContext → 16-bit PCM WAV download |

---

*Built for Carnatic musicians who want to hear the full harmonic beauty of their compositions.*
