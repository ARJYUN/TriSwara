// Full ordered Carnatic scale across 3 octaves (21 positions, indices 0-20)
export const FULL_SCALE = [
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
  "S..", // 20 (implied top, for overflow resolution)
] as const;

export type SwaraToken = typeof FULL_SCALE[number] | "?" | "--";

export interface SwaraMapping {
  base: string;
  normal: string;
  top: string;
}

// Complete harmonic mapping table: index-7 = base, index+7 = top
// "--" means the harmonic note falls outside the defined scale range
export const SWARA_MAP: Record<string, SwaraMapping> = {
  ".R": { base: "..N", normal: ".R", top: ".M" }, // idx 0: base OOB
  ".G": { base: ".S", normal: ".G", top: ".P" }, // idx 1: base OOB
  ".M": { base: ".R", normal: ".M", top: ".D" }, // idx 2: base OOB
  ".P": { base: ".G", normal: ".P", top: ".N" }, // idx 3: base OOB
  ".D": { base: ".M", normal: ".D", top: "S" }, // idx 4: base OOB
  ".N": { base: ".P", normal: ".N", top: "R" }, // idx 5: base OOB
  "S": { base: ".D", normal: "S", top: "G" }, // idx 6
  "R": { base: ".N", normal: "R", top: "M" }, // idx 7
  "G": { base: "S", normal: "G", top: "P" }, // idx 8
  "M": { base: "R", normal: "M", top: "D" }, // idx 9
  "P": { base: "G", normal: "P", top: "N" }, // idx 10
  "D": { base: "M", normal: "D", top: "S." }, // idx 11
  "N": { base: "P", normal: "N", top: "R." }, // idx 12
  "S.": { base: "D", normal: "S.", top: "G." }, // idx 13
  "R.": { base: "N", normal: "R.", top: "M." }, // idx 14
  "G.": { base: "S.", normal: "G.", top: "P." }, // idx 15
  "M.": { base: "R.", normal: "M.", top: "D." }, // idx 16: top OOB
  "P.": { base: "G.", normal: "P.", top: "N." }, // idx 17: top OOB
  "D.": { base: "M.", normal: "D.", top: "S.." }, // idx 18: top OOB
  "N.": { base: "P.", normal: "N.", top: "R.." }, // idx 19: top OOB
};

// All valid swara tokens that Claude can return
export const VALID_TOKENS = new Set([
  ".S", "S", "S.",
  ".R", "R", "R.",
  ".G", "G", "G.",
  ".M", "M", "M.",
  ".P", "P", "P.",
  ".D", "D", "D.",
  ".N", "N", "N.",
]);
