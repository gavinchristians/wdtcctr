import { describe, it, expect } from 'vitest';
import {
  HOP_DURATION,
  HOP_HEIGHT,
  arcY,
  easeOutCubic,
  squashStretchScale,
} from '../../../src/game/engine/hop';

describe('hop', () => {
  it('exposes sane Phase 3 timing constants', () => {
    expect(HOP_DURATION).toBeGreaterThan(0);
    expect(HOP_DURATION).toBeLessThan(0.5);
    expect(HOP_HEIGHT).toBeGreaterThan(0);
  });

  describe('easeOutCubic', () => {
    it('pins endpoints at 0 and 1', () => {
      expect(easeOutCubic(0)).toBe(0);
      expect(easeOutCubic(1)).toBe(1);
    });

    it('clamps inputs outside [0, 1]', () => {
      expect(easeOutCubic(-2)).toBe(0);
      expect(easeOutCubic(5)).toBe(1);
    });

    it('is monotonically non-decreasing across the unit interval', () => {
      let prev = easeOutCubic(0);
      for (let i = 1; i <= 20; i += 1) {
        const next = easeOutCubic(i / 20);
        expect(next).toBeGreaterThanOrEqual(prev);
        prev = next;
      }
    });

    it('is front-loaded (eased out)', () => {
      // At the midpoint a cubic-out has already covered well past half the
      // distance; spot-check the analytical value 0.875.
      expect(easeOutCubic(0.5)).toBeCloseTo(0.875, 5);
    });
  });

  describe('arcY', () => {
    it('returns 0 at both endpoints', () => {
      expect(arcY(0)).toBe(0);
      expect(arcY(1)).toBe(0);
    });

    it('peaks exactly at HOP_HEIGHT at the midpoint', () => {
      expect(arcY(0.5)).toBeCloseTo(HOP_HEIGHT, 10);
    });

    it('is symmetric around the midpoint', () => {
      for (let i = 0; i <= 10; i += 1) {
        const p = i / 10;
        expect(arcY(p)).toBeCloseTo(arcY(1 - p), 10);
      }
    });

    it('clamps to the interval at the endpoints', () => {
      expect(arcY(-1)).toBe(0);
      expect(arcY(2)).toBe(0);
    });

    it('never exceeds HOP_HEIGHT inside the unit interval', () => {
      for (let i = 0; i <= 100; i += 1) {
        expect(arcY(i / 100)).toBeLessThanOrEqual(HOP_HEIGHT + 1e-9);
      }
    });
  });

  describe('squashStretchScale', () => {
    it('returns identity scale at both endpoints', () => {
      const start = squashStretchScale(0);
      const end = squashStretchScale(1);
      for (const v of start) expect(v).toBeCloseTo(1, 6);
      for (const v of end) expect(v).toBeCloseTo(1, 6);
    });

    it('is finite and positive across the hop', () => {
      for (let i = 0; i <= 100; i += 1) {
        const s = squashStretchScale(i / 100);
        for (const v of s) {
          expect(Number.isFinite(v)).toBe(true);
          expect(v).toBeGreaterThan(0);
        }
      }
    });

    it('clamps out-of-range progress to identity', () => {
      const before = squashStretchScale(-10);
      const after = squashStretchScale(10);
      for (const v of before) expect(v).toBeCloseTo(1, 6);
      for (const v of after) expect(v).toBeCloseTo(1, 6);
    });
  });
});
