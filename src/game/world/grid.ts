import * as THREE from 'three';
import { snapToTile } from '../math';

/**
 * The world is laid out on an integer grid where one tile equals one world
 * unit. Keeping the conversion factor 1:1 means tile coordinates can be used
 * directly in `position` props - the only reason this constant exists is so
 * later phases (chunk size, lane width) have a single knob to turn.
 */
export const TILE_SIZE = 1;

/** A discrete (column, row) cell on the gameplay grid. */
export interface Tile {
  x: number;
  z: number;
}

/**
 * Cardinal hop directions. The chicken faces -Z (away from the camera), so
 * `up` moves toward the goal and `down` moves back toward the start.
 */
export type Direction = 'up' | 'down' | 'left' | 'right';

export const DIRECTION_OFFSET: Record<Direction, Tile> = {
  up: { x: 0, z: -1 },
  down: { x: 0, z: 1 },
  left: { x: -1, z: 0 },
  right: { x: 1, z: 0 },
};

export function tileToWorld(tile: Tile, target?: THREE.Vector3): THREE.Vector3 {
  const out = target ?? new THREE.Vector3();
  return out.set(tile.x * TILE_SIZE, 0, tile.z * TILE_SIZE);
}

export function worldToTile(v: THREE.Vector3): Tile {
  return {
    x: snapToTile(v.x, TILE_SIZE),
    z: snapToTile(v.z, TILE_SIZE),
  };
}

export function addTile(a: Tile, b: Tile): Tile {
  return { x: a.x + b.x, z: a.z + b.z };
}

export function tilesEqual(a: Tile, b: Tile): boolean {
  return a.x === b.x && a.z === b.z;
}

export function neighborOf(tile: Tile, dir: Direction): Tile {
  return addTile(tile, DIRECTION_OFFSET[dir]);
}
