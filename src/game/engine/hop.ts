/**
 * Phase 3 hop animation primitives. The placeholder's stiffness lerp is
 * replaced by a time-based parabolic arc so each hop is a discrete, readable
 * motion: lift off, peak, land, with a touch of squash/stretch for juice.
 *
 * Everything here is a pure function of `progress` in `[0, 1]` so the entity
 * layer (`Chicken.tsx`) only has to advance progress per frame and read the
 * resulting position/scale.
 */

/** Total hop duration in seconds. ~Crossy-Road feel: snappy but readable. */
export const HOP_DURATION = 0.18;

/** Peak Y-displacement above the resting plane in world units. */
export const HOP_HEIGHT = 0.45;

/** Clamps `t` to `[0, 1]`. Inlined to keep this module dependency-free. */
function clamp01(t: number): number {
  if (t < 0) return 0;
  if (t > 1) return 1;
  return t;
}

/**
 * Cubic ease-out: fast start, soft landing. Matches the visual expectation
 * that the chicken commits to the hop immediately and decelerates into the
 * destination tile rather than the other way around.
 */
export function easeOutCubic(t: number): number {
  const c = clamp01(t);
  const inv = 1 - c;
  return 1 - inv * inv * inv;
}

/**
 * Parabolic Y-arc with `arcY(0) === 0`, `arcY(1) === 0`, and
 * `arcY(0.5) === HOP_HEIGHT`. Using a clean parabola (rather than a sin
 * curve) makes the apex feel pointier, which reads as a bigger commitment
 * for the same peak height.
 */
export function arcY(progress: number): number {
  const p = clamp01(progress);
  return 4 * HOP_HEIGHT * p * (1 - p);
}

/** Tuple of non-uniform scale factors: `[sx, sy, sz]`. */
export type ScaleTriplet = readonly [number, number, number];

/**
 * Squash/stretch shape, designed to be subtle:
 *  - At rest (`p === 0` or `p === 1`): scale is exactly `[1, 1, 1]`.
 *  - Around takeoff (`p ≈ 0.15`): squash (shorter, wider).
 *  - Around peak    (`p ≈ 0.5`):  slight stretch (taller, narrower).
 *  - Around landing (`p ≈ 0.85`): squash again, lighter.
 *
 * The X/Z scales mirror Y inversely (volume-preserving on the cardinal axes)
 * which keeps the chicken from looking like it's inflating.
 */
export function squashStretchScale(progress: number): ScaleTriplet {
  const p = clamp01(progress);
  // Triangle wave that peaks at p=0.5 and is 0 at the endpoints; gives a
  // single smooth deformation envelope across the whole hop.
  const env = 1 - Math.abs(2 * p - 1);
  // Bias: takeoff/landing squash (-) vs peak stretch (+).
  // sin(env*PI) is 0 at endpoints, peaks at env=0.5 (i.e. p=0.25 and p=0.75).
  const phase = Math.sin(p * Math.PI * 2); // -1..1: -1 at p=0.75, +1 at p=0.25
  // Combine: amplitude scales with env so endpoints stay at 1.
  const amp = 0.12 * env;
  // Phase < 0 => squash (sy < 1, sx/sz > 1); phase > 0 => stretch.
  const sy = 1 + amp * phase;
  const lateral = 1 - amp * phase * 0.5;
  return [lateral, sy, lateral];
}
