import { describe, it, expect } from 'vitest';
import { mulberry32, makeRng, randInt, weightedPick } from '../../../src/game/world/rng';

describe('rng', () => {
  it('mulberry32 produces values in [0, 1)', () => {
    const rng = mulberry32(42);
    for (let i = 0; i < 1000; i += 1) {
      const v = rng();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('the same seed reproduces the same sequence', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    for (let i = 0; i < 16; i += 1) {
      expect(a()).toBe(b());
    }
  });

  it('different seeds diverge within a few draws', () => {
    const a = mulberry32(1);
    const b = mulberry32(2);
    let diverged = false;
    for (let i = 0; i < 16; i += 1) {
      if (a() !== b()) {
        diverged = true;
        break;
      }
    }
    expect(diverged).toBe(true);
  });

  it('mean over 10k draws is within 0.02 of 0.5', () => {
    const rng = mulberry32(7);
    let sum = 0;
    const n = 10000;
    for (let i = 0; i < n; i += 1) sum += rng();
    expect(Math.abs(sum / n - 0.5)).toBeLessThan(0.02);
  });

  it('makeRng is an alias for mulberry32', () => {
    expect(makeRng).toBe(mulberry32);
  });

  it('randInt stays inside the inclusive range', () => {
    const rng = mulberry32(11);
    for (let i = 0; i < 1000; i += 1) {
      const v = randInt(rng, 3, 7);
      expect(v).toBeGreaterThanOrEqual(3);
      expect(v).toBeLessThanOrEqual(7);
      expect(Number.isInteger(v)).toBe(true);
    }
  });

  it('weightedPick respects relative weights', () => {
    const rng = mulberry32(99);
    const counts = { a: 0, b: 0 };
    const n = 10000;
    for (let i = 0; i < n; i += 1) {
      counts[weightedPick(rng, { a: 0.75, b: 0.25 })] += 1;
    }
    const ratio = counts.a / n;
    expect(ratio).toBeGreaterThan(0.7);
    expect(ratio).toBeLessThan(0.8);
  });

  it('weightedPick falls back to the first key when all weights are non-positive', () => {
    const rng = mulberry32(0);
    expect(weightedPick(rng, { a: 0, b: 0, c: 0 })).toBe('a');
  });
});
