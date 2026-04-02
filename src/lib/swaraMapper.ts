import { SWARA_MAP } from './swaraData';

export interface HarmonicResult {
  base: string[][];
  normal: string[][];
  top: string[][];
}

/**
 * Maps a 2D array of swara tokens to their harmonic equivalents.
 * Each input row preserves structure; base = 7 positions back, top = 7 forward.
 */
export function mapToHarmonics(rows: string[][]): HarmonicResult {
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

/**
 * Parses octave from a swara token for CSS data-octave attribute.
 * Returns "base" | "normal" | "top"
 */
export function getOctave(token: string): "base" | "normal" | "top" {
  if (token.startsWith(".")) return "base";
  if (token.endsWith(".") || token.endsWith("..")) return "top";
  return "normal";
}
