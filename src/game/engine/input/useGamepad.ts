import { useEffect } from 'react';
import type { Direction } from '../../world/grid';

/** Stick magnitude required to register as a directional press. */
const STICK_DEADZONE = 0.5;

/** Standard Gamepad mapping: D-pad button indices. */
const DPAD = {
  up: 12,
  down: 13,
  left: 14,
  right: 15,
} as const;

/** Snapshot of which directional inputs are currently held. */
export interface DpadState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export const REST_DPAD: DpadState = { up: false, down: false, left: false, right: false };

/**
 * Pure: derives the set of pressed directions for a gamepad snapshot. Stick
 * input wins over D-pad (matches mainstream gamepad UX where simultaneous
 * inputs from both bias toward the analog axis), but only one axis can be
 * pressed at a time on the stick - whichever has the larger absolute value
 * past the deadzone.
 */
export function readPadState(pad: Gamepad | null): DpadState {
  if (!pad) return REST_DPAD;
  const buttons = pad.buttons;
  const axes = pad.axes;
  const ax = axes[0] ?? 0;
  const ay = axes[1] ?? 0;
  let stickUp = false;
  let stickDown = false;
  let stickLeft = false;
  let stickRight = false;
  if (Math.abs(ax) > STICK_DEADZONE || Math.abs(ay) > STICK_DEADZONE) {
    if (Math.abs(ax) >= Math.abs(ay)) {
      if (ax > 0) stickRight = true;
      else stickLeft = true;
    } else {
      if (ay > 0) stickDown = true;
      else stickUp = true;
    }
  }
  return {
    up: stickUp || (buttons[DPAD.up]?.pressed ?? false),
    down: stickDown || (buttons[DPAD.down]?.pressed ?? false),
    left: stickLeft || (buttons[DPAD.left]?.pressed ?? false),
    right: stickRight || (buttons[DPAD.right]?.pressed ?? false),
  };
}

/**
 * Pure: emits Direction events for rest→press transitions only. Holding a
 * direction never re-fires; releasing and re-pressing does.
 */
export function diffPadState(prev: DpadState, next: DpadState): Direction[] {
  const events: Direction[] = [];
  if (next.up && !prev.up) events.push('up');
  if (next.down && !prev.down) events.push('down');
  if (next.left && !prev.left) events.push('left');
  if (next.right && !prev.right) events.push('right');
  return events;
}

/**
 * Subscribes to the first connected gamepad while mounted. Polls via
 * `requestAnimationFrame` (the only reliable cadence for buttons; gamepad
 * events are only fired on connect/disconnect). Edge-triggered: holding a
 * direction will not auto-repeat hops, mirroring keyboard behaviour
 * (`event.repeat` is filtered out in `useDirectionalInput`).
 */
export function useGamepad(onDirection: (dir: Direction) => void): void {
  useEffect(() => {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') {
      return;
    }
    let prev: DpadState = REST_DPAD;
    let raf = 0;
    const tick = (): void => {
      const pads = navigator.getGamepads();
      const pad = pads.find((p): p is Gamepad => p !== null && p.connected) ?? null;
      const next = readPadState(pad);
      for (const dir of diffPadState(prev, next)) {
        onDirection(dir);
      }
      prev = next;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDirection]);
}
