import {
  CHUNK_SIZE,
  HALF_WIDTH,
  LANE_WEIGHTS,
  MAX_CONSECUTIVE_WATER,
  START_GRASS_LANES,
} from '../config';
import { makeRng, randInt, weightedPick } from '../rng';
import type { Chunk, Lane, LaneKind, Obstacle, ObstacleKind } from './types';

/** Probability an obstacle on grass is a tree (vs a rock). */
const TREE_PROBABILITY = 0.8;

/** Inclusive minimum / maximum obstacles per grass lane. */
const MIN_OBSTACLES = 0;
const MAX_OBSTACLES = 3;

/**
 * Hash (seed, chunkIndex) into a uint32 so each chunk gets its own
 * sub-stream from the same world seed. This means the contents of a given
 * chunk only depend on (seed, chunkIndex) and the history threaded in,
 * which is what tests rely on.
 */
function chunkSeed(seed: number, chunkIndex: number): number {
  let h = (seed ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (chunkIndex + 0x85ebca6b), 0xc2b2ae35) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0x27d4eb2f) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

function rollObstacleKind(rng: () => number): ObstacleKind {
  return rng() < TREE_PROBABILITY ? 'tree' : 'rock';
}

function pickObstacleColumns(rng: () => number, allowZero: boolean): number[] {
  const count = randInt(rng, MIN_OBSTACLES, MAX_OBSTACLES);
  if (count === 0) return [];
  const columns = new Set<number>();
  // Bounded attempts so a pathological RNG can't loop forever; the search
  // space is tiny (17 cells) so collisions resolve quickly in practice.
  let attempts = 0;
  while (columns.size < count && attempts < count * 8) {
    attempts += 1;
    const x = randInt(rng, -HALF_WIDTH, HALF_WIDTH);
    if (!allowZero && x === 0) continue;
    columns.add(x);
  }
  return [...columns].sort((a, b) => a - b);
}

function generateLaneKind(rng: () => number, history: readonly LaneKind[]): LaneKind {
  let recentWater = 0;
  for (let i = history.length - 1; i >= 0; i -= 1) {
    if (history[i] === 'water') recentWater += 1;
    else break;
  }
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const pick = weightedPick(rng, LANE_WEIGHTS);
    if (pick === 'water' && recentWater >= MAX_CONSECUTIVE_WATER) continue;
    return pick;
  }
  return 'grass';
}

/**
 * Generates a single chunk. Pure - the only state is whatever the caller
 * passes in. `history` is the sequence of lane kinds preceding this
 * chunk's first lane (most recent last); only the trailing run of `water`
 * affects the output.
 */
export function generateChunk(index: number, seed: number, history: readonly LaneKind[]): Chunk {
  const rng = makeRng(chunkSeed(seed, index));
  // `-0` is a valid number in JS but trips strict equality with `0` in tests
  // and serialization, so normalize it away.
  const startZ = index === 0 ? 0 : -index * CHUNK_SIZE;
  const endZ = startZ - (CHUNK_SIZE - 1);
  const lanes: Lane[] = [];
  const runningHistory: LaneKind[] = [...history];

  for (let i = 0; i < CHUNK_SIZE; i += 1) {
    const z = startZ - i;
    const absoluteIndex = -z;

    let kind: LaneKind;
    let obstacles: Obstacle[] = [];

    if (absoluteIndex < START_GRASS_LANES) {
      kind = 'grass';
    } else {
      kind = generateLaneKind(rng, runningHistory);
      if (kind === 'grass') {
        const allowZero = absoluteIndex >= START_GRASS_LANES * 2;
        const columns = pickObstacleColumns(rng, allowZero);
        obstacles = columns.map((x) => ({ x, kind: rollObstacleKind(rng) }));
      }
    }

    lanes.push({ z, kind, obstacles });
    runningHistory.push(kind);
  }

  return { index, startZ, endZ, lanes };
}

/**
 * Convenience helper: walks chunk 0..N-1 sequentially, threading history
 * automatically. Used by the finite world source and by tests that want a
 * full deterministic world.
 */
export function generateWorld(seed: number, chunkCount: number): Chunk[] {
  const chunks: Chunk[] = [];
  const history: LaneKind[] = [];
  for (let i = 0; i < chunkCount; i += 1) {
    const chunk = generateChunk(i, seed, history);
    chunks.push(chunk);
    for (const lane of chunk.lanes) history.push(lane.kind);
  }
  return chunks;
}
