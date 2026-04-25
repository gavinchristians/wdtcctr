import type { LaneKind } from './lanes/types';

/**
 * Total playable width in tiles. Tiles span [-HALF_WIDTH, +HALF_WIDTH]
 * inclusive, so LANE_WIDTH must be odd.
 */
export const LANE_WIDTH = 17;
export const HALF_WIDTH = (LANE_WIDTH - 1) / 2;

/**
 * Lanes per generator chunk. Larger chunks mean fewer regenerations but
 * larger work spikes when streaming; 16 is a comfortable middle.
 */
export const CHUNK_SIZE = 16;

/**
 * Total playable run length in lanes for the finite world. Phase 5 will
 * swap the finite WorldSource for an endless one and ignore this value.
 */
export const FINITE_LENGTH = 200;

/**
 * Number of guaranteed obstacle-free grass lanes at z = 0..-(N-1) so the
 * chicken always has a safe spawn area.
 */
export const START_GRASS_LANES = 4;

/**
 * Default seed used when nothing else has been provided. Phase 5 will
 * derive this per-run from the run timestamp / share-code.
 */
export const WORLD_SEED = 1;

/**
 * Weighted distribution for lane kinds. Values are summed by the
 * generator, so they don't need to add up to exactly 1.
 */
export const LANE_WEIGHTS: Record<LaneKind, number> = {
  grass: 0.45,
  road: 0.3,
  water: 0.2,
  rail: 0.05,
};

/**
 * Hard cap on how many water lanes can appear consecutively. Without this
 * Phase 4 would have to invent rules to keep runs survivable.
 */
export const MAX_CONSECUTIVE_WATER = 2;
