export type LaneKind = 'grass' | 'road' | 'water' | 'rail';

export type ObstacleKind = 'tree' | 'rock';

export interface Obstacle {
  /** Tile column the obstacle sits on (within [-HALF_WIDTH, HALF_WIDTH]). */
  x: number;
  kind: ObstacleKind;
}

export interface Lane {
  /**
   * Tile row the lane occupies. Negative values grow forward (away from the
   * camera), matching the Phase 1 `up = -z` convention.
   */
  z: number;
  kind: LaneKind;
  /** Always empty for non-grass lanes in Phase 2. */
  obstacles: Obstacle[];
}

export interface Chunk {
  /** Zero-based chunk index along the forward axis. */
  index: number;
  /** Inclusive z value of the first (closest to spawn) lane in the chunk. */
  startZ: number;
  /** Inclusive z value of the last (furthest from spawn) lane in the chunk. */
  endZ: number;
  /** Lanes ordered from startZ to endZ (decreasing z, i.e. forward). */
  lanes: Lane[];
}
