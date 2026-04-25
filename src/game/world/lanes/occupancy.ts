import { HALF_WIDTH } from '../config';
import type { Tile } from '../grid';
import type { WorldSource } from './chunkManager';

/**
 * True if the chicken cannot move onto `tile`. Phase 2 treats the
 * following as blocked:
 *
 * - Anything outside the playable column band (`|x| > HALF_WIDTH`).
 * - Tiles whose lane doesn't exist (before spawn or past the run).
 * - Water lanes (Phase 4 lifts this once a log is on the tile).
 * - Grass lanes that have a tree or rock at this column.
 *
 * Road and rail lanes are always open in Phase 2; vehicles arrive in
 * Phase 4 and will be checked separately.
 */
export function isBlocked(tile: Tile, world: WorldSource): boolean {
  if (Math.abs(tile.x) > HALF_WIDTH) return true;

  const lane = world.getLane(tile.z);
  if (!lane) return true;

  if (lane.kind === 'water') return true;
  if (lane.kind === 'grass') {
    return lane.obstacles.some((o) => o.x === tile.x);
  }
  return false;
}
