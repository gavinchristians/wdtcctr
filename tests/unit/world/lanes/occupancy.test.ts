import { describe, it, expect } from 'vitest';
import { isBlocked } from '../../../../src/game/world/lanes/occupancy';
import type { WorldSource } from '../../../../src/game/world/lanes/chunkManager';
import type { Lane } from '../../../../src/game/world/lanes/types';
import { HALF_WIDTH } from '../../../../src/game/world/config';

function fakeWorld(byZ: Record<number, Lane | undefined>): WorldSource {
  return {
    getLane: (z) => byZ[z],
    ensureWindow: () => undefined,
    activeChunks: new Map(),
    subscribe: () => () => undefined,
    length: Infinity,
  };
}

const grassClear: Lane = { z: 0, kind: 'grass', obstacles: [] };
const grassWithTree: Lane = {
  z: -1,
  kind: 'grass',
  obstacles: [{ x: 2, kind: 'tree' }],
};
const water: Lane = { z: -2, kind: 'water', obstacles: [] };
const road: Lane = { z: -3, kind: 'road', obstacles: [] };
const rail: Lane = { z: -4, kind: 'rail', obstacles: [] };

describe('isBlocked', () => {
  const world = fakeWorld({
    [0]: grassClear,
    [-1]: grassWithTree,
    [-2]: water,
    [-3]: road,
    [-4]: rail,
  });

  it('blocks tiles past the side kill zone', () => {
    expect(isBlocked({ x: HALF_WIDTH + 1, z: 0 }, world)).toBe(true);
    expect(isBlocked({ x: -HALF_WIDTH - 1, z: 0 }, world)).toBe(true);
  });

  it('keeps the band edges open', () => {
    expect(isBlocked({ x: HALF_WIDTH, z: 0 }, world)).toBe(false);
    expect(isBlocked({ x: -HALF_WIDTH, z: 0 }, world)).toBe(false);
  });

  it('blocks tiles whose lane does not exist', () => {
    expect(isBlocked({ x: 0, z: -99 }, world)).toBe(true);
  });

  it('blocks water lanes regardless of column', () => {
    expect(isBlocked({ x: 0, z: -2 }, world)).toBe(true);
    expect(isBlocked({ x: 4, z: -2 }, world)).toBe(true);
  });

  it('blocks grass tiles that hold an obstacle and lets neighbors through', () => {
    expect(isBlocked({ x: 2, z: -1 }, world)).toBe(true);
    expect(isBlocked({ x: 1, z: -1 }, world)).toBe(false);
    expect(isBlocked({ x: 3, z: -1 }, world)).toBe(false);
  });

  it('treats road and rail lanes as walkable in Phase 2', () => {
    expect(isBlocked({ x: 0, z: -3 }, world)).toBe(false);
    expect(isBlocked({ x: HALF_WIDTH, z: -4 }, world)).toBe(false);
  });
});
