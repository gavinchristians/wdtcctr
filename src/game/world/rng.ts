/**
 * mulberry32 - a tiny seedable PRNG that's good enough for procedural
 * world generation and trivially deterministic across platforms.
 *
 * Reference: https://stackoverflow.com/a/47593316
 */
export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Public alias kept for readability at call sites. */
export const makeRng = mulberry32;

/** Inclusive integer in [min, max] using the supplied generator. */
export function randInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Picks one entry from a record keyed by its name and weighted by its
 * value. Treats negative or NaN weights as zero.
 */
export function weightedPick<K extends string>(rng: () => number, weights: Record<K, number>): K {
  let total = 0;
  const entries = Object.entries(weights) as Array<[K, number]>;
  for (const [, w] of entries) {
    if (w > 0) total += w;
  }
  if (total <= 0) {
    return entries[0]?.[0] as K;
  }
  let pick = rng() * total;
  for (const [key, w] of entries) {
    if (w <= 0) continue;
    pick -= w;
    if (pick <= 0) return key;
  }
  return entries[entries.length - 1][0];
}
