/**
 * Snap a continuous world coordinate to the nearest integer tile center.
 * Used later by the chicken hop system to keep movement on a 1-unit grid.
 */
export function snapToTile(value: number, tileSize = 1): number {
  return Math.round(value / tileSize) * tileSize;
}

/**
 * Clamp a number into the inclusive range [min, max].
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`clamp: min (${min}) must be <= max (${max})`);
  }
  return Math.max(min, Math.min(max, value));
}
