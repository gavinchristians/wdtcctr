import { describe, it, expect, vi } from 'vitest';
import {
  chunkIndexForZ,
  createFiniteWorldSource,
} from '../../../../src/game/world/lanes/chunkManager';
import { CHUNK_SIZE, FINITE_LENGTH } from '../../../../src/game/world/config';

describe('chunkIndexForZ', () => {
  it('places z = 0 in chunk 0 and z = -CHUNK_SIZE at the chunk boundary', () => {
    expect(chunkIndexForZ(0)).toBe(0);
    expect(chunkIndexForZ(-(CHUNK_SIZE - 1))).toBe(0);
    expect(chunkIndexForZ(-CHUNK_SIZE)).toBe(1);
    expect(chunkIndexForZ(-CHUNK_SIZE * 2)).toBe(2);
  });

  it('returns -1 for invalid (positive) z values', () => {
    expect(chunkIndexForZ(1)).toBe(-1);
  });
});

describe('createFiniteWorldSource', () => {
  it('starts empty until ensureWindow is called', () => {
    const world = createFiniteWorldSource(1, 64);
    expect(world.activeChunks.size).toBe(0);
    expect(world.getLane(0)).toBeUndefined();
    world.ensureWindow(0);
    expect(world.activeChunks.size).toBe(Math.ceil(64 / CHUNK_SIZE));
  });

  it('getLane returns the correct lane for valid z values after ensureWindow', () => {
    const world = createFiniteWorldSource(2, 32);
    world.ensureWindow(0);
    const spawn = world.getLane(0);
    expect(spawn?.z).toBe(0);
    expect(spawn?.kind).toBe('grass');

    const last = world.getLane(-31);
    expect(last?.z).toBe(-31);
  });

  it('getLane returns undefined for z past the finite length or before spawn', () => {
    const world = createFiniteWorldSource(2, 32);
    world.ensureWindow(0);
    expect(world.getLane(1)).toBeUndefined();
    expect(world.getLane(-32)).toBeUndefined();
    expect(world.getLane(-1000)).toBeUndefined();
  });

  it('subscribe fires once when ensureWindow generates chunks for the first time', () => {
    const world = createFiniteWorldSource(3, 32);
    const listener = vi.fn();
    const unsub = world.subscribe(listener);

    world.ensureWindow(0);
    expect(listener).toHaveBeenCalledTimes(1);

    world.ensureWindow(0);
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    world.ensureWindow(0);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('uses the default FINITE_LENGTH when none is supplied', () => {
    const world = createFiniteWorldSource(4);
    world.ensureWindow(0);
    expect(world.length).toBe(FINITE_LENGTH);
    expect(world.activeChunks.size).toBe(Math.ceil(FINITE_LENGTH / CHUNK_SIZE));
  });

  it('produces deterministic content across two sources with the same seed', () => {
    const a = createFiniteWorldSource(5, 32);
    const b = createFiniteWorldSource(5, 32);
    a.ensureWindow(0);
    b.ensureWindow(0);
    for (let z = 0; z > -32; z -= 1) {
      expect(a.getLane(z)).toEqual(b.getLane(z));
    }
  });
});
