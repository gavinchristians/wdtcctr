import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  DIRECTION_OFFSET,
  TILE_SIZE,
  addTile,
  neighborOf,
  tileToWorld,
  tilesEqual,
  worldToTile,
} from '../../../src/game/world/grid';

describe('grid', () => {
  it('TILE_SIZE is 1 so tile coords map directly to world units', () => {
    expect(TILE_SIZE).toBe(1);
  });

  it('tileToWorld puts tiles on the y=0 plane', () => {
    const v = tileToWorld({ x: 3, z: -2 });
    expect(v.x).toBe(3);
    expect(v.y).toBe(0);
    expect(v.z).toBe(-2);
  });

  it('tileToWorld can write into a provided Vector3 to avoid allocations', () => {
    const reuse = new THREE.Vector3(99, 99, 99);
    const v = tileToWorld({ x: 1, z: 4 }, reuse);
    expect(v).toBe(reuse);
    expect(reuse.toArray()).toEqual([1, 0, 4]);
  });

  it('worldToTile snaps any near-grid Vector3 back to a Tile', () => {
    expect(worldToTile(new THREE.Vector3(2.4, 0.7, -0.6))).toEqual({ x: 2, z: -1 });
    expect(worldToTile(new THREE.Vector3(0, 0, 0))).toEqual({ x: 0, z: 0 });
  });

  it('tileToWorld and worldToTile round-trip integer tiles', () => {
    const inputs: Array<{ x: number; z: number }> = [
      { x: 0, z: 0 },
      { x: 5, z: -7 },
      { x: -3, z: 11 },
    ];
    for (const tile of inputs) {
      expect(worldToTile(tileToWorld(tile))).toEqual(tile);
    }
  });

  it('DIRECTION_OFFSET matches the camera-facing convention (up = -z)', () => {
    expect(DIRECTION_OFFSET.up).toEqual({ x: 0, z: -1 });
    expect(DIRECTION_OFFSET.down).toEqual({ x: 0, z: 1 });
    expect(DIRECTION_OFFSET.left).toEqual({ x: -1, z: 0 });
    expect(DIRECTION_OFFSET.right).toEqual({ x: 1, z: 0 });
  });

  it('addTile sums components without mutating inputs', () => {
    const a = { x: 1, z: 2 };
    const b = { x: -3, z: 5 };
    expect(addTile(a, b)).toEqual({ x: -2, z: 7 });
    expect(a).toEqual({ x: 1, z: 2 });
    expect(b).toEqual({ x: -3, z: 5 });
  });

  it('neighborOf returns the adjacent tile in each cardinal direction', () => {
    const origin = { x: 4, z: 4 };
    expect(neighborOf(origin, 'up')).toEqual({ x: 4, z: 3 });
    expect(neighborOf(origin, 'down')).toEqual({ x: 4, z: 5 });
    expect(neighborOf(origin, 'left')).toEqual({ x: 3, z: 4 });
    expect(neighborOf(origin, 'right')).toEqual({ x: 5, z: 4 });
  });

  it('tilesEqual compares structurally', () => {
    expect(tilesEqual({ x: 1, z: 2 }, { x: 1, z: 2 })).toBe(true);
    expect(tilesEqual({ x: 1, z: 2 }, { x: 2, z: 1 })).toBe(false);
  });
});
