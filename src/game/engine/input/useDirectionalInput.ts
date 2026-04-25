import { useEffect } from 'react';
import type { Direction } from '../../world/grid';

/**
 * Maps a keyboard event's `code` to a normalized cardinal direction.
 * Returns `null` for any other key. Using `code` (not `key`) keeps the
 * mapping stable across keyboard layouts.
 */
const KEY_TO_DIRECTION: Readonly<Record<string, Direction>> = {
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
};

/**
 * Subscribes to window keydown events and invokes `onDirection` once per
 * physical key press for arrows or WASD. Auto-repeating keydowns are
 * ignored to keep the placeholder chicken feeling deliberate; Phase 3 will
 * replace this with an input queue + hop animation.
 */
export function useDirectionalInput(onDirection: (dir: Direction) => void): void {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      const direction = KEY_TO_DIRECTION[event.code];
      if (!direction) return;
      event.preventDefault();
      onDirection(direction);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onDirection]);
}
