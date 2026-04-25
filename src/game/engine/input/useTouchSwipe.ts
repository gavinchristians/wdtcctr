import { useDrag } from '@use-gesture/react';
import { useCallback } from 'react';
import type { Direction } from '../../world/grid';

/**
 * Distance (CSS px) below which a touch is treated as a tap, not a swipe.
 * Tuned by feel on a phone: low enough that flicks feel responsive, high
 * enough that a thumb resting on the screen doesn't fire random hops.
 */
const SWIPE_DISTANCE = 24;

/**
 * Minimum gesture velocity (CSS px / ms) for a swipe at `dragEnd` to count.
 * Without this, slow drags can satisfy the distance threshold and produce
 * unintended hops.
 */
const SWIPE_VELOCITY = 0.2;

/**
 * Returns the `bind()` props from `@use-gesture/react`'s `useDrag` configured
 * to fire `onDirection` once per swipe at gesture end. Spread the result on
 * a DOM element that wraps the canvas (`<div {...bind()} />`) - gestures are
 * DOM-side and can't be attached to R3F primitives.
 *
 * Uses `@use-gesture`'s built-in `swipe` classifier rather than hand-rolling
 * angle math: the library already tracks distance + velocity per axis and
 * yields a clean `[sx, sy]` triplet in `{-1, 0, 1}` at the end of the drag.
 */
export function useTouchSwipe(onDirection: (dir: Direction) => void): ReturnType<typeof useDrag> {
  const handler = useCallback<Parameters<typeof useDrag>[0]>(
    (state) => {
      if (!state.last) return;
      const [sx, sy] = state.swipe as [number, number];
      let dir: Direction | null = null;
      if (sx === 1) dir = 'right';
      else if (sx === -1) dir = 'left';
      else if (sy === 1) dir = 'down';
      else if (sy === -1) dir = 'up';
      if (dir) onDirection(dir);
    },
    [onDirection],
  );

  return useDrag(handler, {
    swipe: { distance: SWIPE_DISTANCE, velocity: SWIPE_VELOCITY },
    filterTaps: true,
    pointer: { touch: true },
  });
}
