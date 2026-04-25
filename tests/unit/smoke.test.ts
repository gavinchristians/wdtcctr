import { describe, it, expect } from 'vitest';
import { clamp, snapToTile } from '../../src/game/math';

describe('smoke: math utilities', () => {
  it('snapToTile rounds to the nearest unit by default', () => {
    expect(snapToTile(0.4)).toBe(0);
    expect(snapToTile(0.6)).toBe(1);
    expect(snapToTile(-0.6)).toBe(-1);
  });

  it('snapToTile respects a custom tile size', () => {
    expect(snapToTile(7, 2)).toBe(8);
    expect(snapToTile(6.9, 2)).toBe(6);
  });

  it('clamp keeps values inside the range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });

  it('clamp throws on inverted bounds', () => {
    expect(() => clamp(0, 10, 0)).toThrow();
  });
});
