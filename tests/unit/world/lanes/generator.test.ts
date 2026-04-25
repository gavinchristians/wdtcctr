import { describe, it, expect } from 'vitest';
import { generateChunk, generateWorld } from '../../../../src/game/world/lanes/generator';
import {
  CHUNK_SIZE,
  HALF_WIDTH,
  MAX_CONSECUTIVE_WATER,
  START_GRASS_LANES,
} from '../../../../src/game/world/config';
import type { Lane, LaneKind } from '../../../../src/game/world/lanes/types';

function flatten(chunks: ReturnType<typeof generateWorld>): Lane[] {
  return chunks.flatMap((c) => c.lanes);
}

describe('generator.generateChunk', () => {
  it('lays out CHUNK_SIZE lanes with strictly decreasing z', () => {
    const chunk = generateChunk(0, 1, []);
    expect(chunk.lanes).toHaveLength(CHUNK_SIZE);
    expect(chunk.startZ).toBe(0);
    expect(chunk.endZ).toBe(-(CHUNK_SIZE - 1));
    for (let i = 0; i < chunk.lanes.length; i += 1) {
      expect(chunk.lanes[i].z).toBe(i === 0 ? 0 : -i);
    }
  });

  it('is deterministic given the same (seed, index, history)', () => {
    const a = generateChunk(3, 42, ['grass', 'road', 'water']);
    const b = generateChunk(3, 42, ['grass', 'road', 'water']);
    expect(a).toEqual(b);
  });

  it('different chunk indices produce different content for the same seed', () => {
    const a = generateChunk(0, 7, []);
    const b = generateChunk(1, 7, []);
    expect(a.lanes.map((l) => l.kind).join()).not.toBe(b.lanes.map((l) => l.kind).join());
  });

  it('different seeds diverge at chunk 0', () => {
    const a = generateChunk(0, 1, []);
    const b = generateChunk(0, 2, []);
    expect(a).not.toEqual(b);
  });
});

describe('generator rules', () => {
  it('the first START_GRASS_LANES lanes are obstacle-free grass', () => {
    const lanes = flatten(generateWorld(1, 2));
    for (let i = 0; i < START_GRASS_LANES; i += 1) {
      const lane = lanes[i];
      expect(lane.kind).toBe('grass');
      expect(lane.obstacles).toEqual([]);
    }
  });

  it('never produces more than MAX_CONSECUTIVE_WATER water lanes in a row across many seeds', () => {
    for (const seed of [1, 2, 3, 17, 99, 1234]) {
      const lanes = flatten(generateWorld(seed, 16));
      let run = 0;
      for (const lane of lanes) {
        run = lane.kind === 'water' ? run + 1 : 0;
        expect(run).toBeLessThanOrEqual(MAX_CONSECUTIVE_WATER);
      }
    }
  });

  it('every obstacle sits inside [-HALF_WIDTH, HALF_WIDTH] and obstacles within a lane are unique', () => {
    const lanes = flatten(generateWorld(2026, 8));
    for (const lane of lanes) {
      const xs = new Set<number>();
      for (const o of lane.obstacles) {
        expect(o.x).toBeGreaterThanOrEqual(-HALF_WIDTH);
        expect(o.x).toBeLessThanOrEqual(HALF_WIDTH);
        expect(xs.has(o.x)).toBe(false);
        xs.add(o.x);
      }
    }
  });

  it('keeps the spawn column (x = 0) clear for the first 2*START_GRASS_LANES lanes', () => {
    const lanes = flatten(generateWorld(1234, 4));
    for (let i = 0; i < START_GRASS_LANES * 2; i += 1) {
      const lane = lanes[i];
      expect(lane.obstacles.find((o) => o.x === 0)).toBeUndefined();
    }
  });

  it('produces a mix of trees and rocks across a long run', () => {
    const lanes = flatten(generateWorld(7, 16));
    const kinds = new Set(lanes.flatMap((l) => l.obstacles.map((o) => o.kind)));
    expect(kinds.has('tree')).toBe(true);
    expect(kinds.has('rock')).toBe(true);
  });

  it('non-grass lanes never carry obstacles in Phase 2', () => {
    const lanes = flatten(generateWorld(11, 8));
    const nonGrassWithObstacles = lanes.filter((l) => l.kind !== 'grass' && l.obstacles.length > 0);
    expect(nonGrassWithObstacles).toEqual([]);
  });

  it('produces every lane kind across enough seeds', () => {
    const seen = new Set<LaneKind>();
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const lane of flatten(generateWorld(seed, 4))) seen.add(lane.kind);
    }
    expect(seen.has('grass')).toBe(true);
    expect(seen.has('road')).toBe(true);
    expect(seen.has('water')).toBe(true);
    expect(seen.has('rail')).toBe(true);
  });
});
