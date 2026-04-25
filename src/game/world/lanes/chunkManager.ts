import { CHUNK_SIZE, FINITE_LENGTH } from '../config';
import { generateChunk } from './generator';
import type { Chunk, Lane, LaneKind } from './types';

/**
 * Read-only view of the generated world. Anything that needs to know what
 * lane lives at a given z value goes through this interface, which means
 * Phase 5's endless implementation only needs to provide the same methods.
 */
export interface WorldSource {
  /**
   * Returns the lane at row `z` if one exists, or undefined for tiles that
   * fall outside the playable run (before spawn or past the finish line in
   * a finite world).
   */
  getLane(z: number): Lane | undefined;
  /**
   * Tells the source to make sure all chunks the chicken (and a small
   * forward window) are likely to need exist. Cheap to call repeatedly;
   * the finite source ignores `centerZ` and just generates everything once.
   */
  ensureWindow(centerZ: number): void;
  readonly activeChunks: ReadonlyMap<number, Chunk>;
  /** Subscribe to active-chunk changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void;
  /** Total finite length, or `Infinity` for endless sources. */
  readonly length: number;
}

/**
 * Maps a lane row (z) to the chunk index that owns it. Forward (negative
 * z) lanes are split into chunks of `CHUNK_SIZE`. The spawn lane (z = 0)
 * lives in chunk 0.
 */
export function chunkIndexForZ(z: number): number {
  if (z > 0) return -1;
  // `Math.floor(-0 / N)` returns `-0`; force a positive zero so callers
  // can rely on Object.is(idx, 0) when keying maps or comparing to 0.
  if (z === 0) return 0;
  return Math.floor(-z / CHUNK_SIZE);
}

export function createFiniteWorldSource(seed: number, length = FINITE_LENGTH): WorldSource {
  const totalChunks = Math.max(0, Math.ceil(length / CHUNK_SIZE));
  const chunks = new Map<number, Chunk>();
  const listeners = new Set<() => void>();
  let generated = false;

  const generateAll = () => {
    if (generated) return;
    generated = true;
    const history: LaneKind[] = [];
    for (let i = 0; i < totalChunks; i += 1) {
      const chunk = generateChunk(i, seed, history);
      chunks.set(i, chunk);
      for (const lane of chunk.lanes) history.push(lane.kind);
    }
    for (const fn of listeners) fn();
  };

  const getLane = (z: number): Lane | undefined => {
    if (z > 0 || -z >= length) return undefined;
    const idx = chunkIndexForZ(z);
    const chunk = chunks.get(idx);
    if (!chunk) return undefined;
    // Lanes within a chunk are ordered with decreasing z starting at startZ.
    return chunk.lanes[chunk.startZ - z];
  };

  return {
    getLane,
    ensureWindow: () => generateAll(),
    get activeChunks() {
      return chunks as ReadonlyMap<number, Chunk>;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    length,
  };
}
