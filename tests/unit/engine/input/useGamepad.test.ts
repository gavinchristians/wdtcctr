import { describe, it, expect } from 'vitest';
import {
  REST_DPAD,
  diffPadState,
  readPadState,
  type DpadState,
} from '../../../../src/game/engine/input/useGamepad';

function makePad(opts: {
  buttons?: Partial<Record<12 | 13 | 14 | 15, boolean>>;
  axes?: [number, number];
}): Gamepad {
  const buttonStates = Array.from({ length: 17 }, (_, i) => ({
    pressed: opts.buttons?.[i as 12 | 13 | 14 | 15] ?? false,
    touched: false,
    value: 0,
  }));
  return {
    id: 'fake',
    index: 0,
    connected: true,
    timestamp: 0,
    mapping: 'standard',
    axes: opts.axes ?? [0, 0],
    buttons: buttonStates as unknown as readonly GamepadButton[],
    hapticActuators: [],
    vibrationActuator: null,
  } as unknown as Gamepad;
}

describe('useGamepad / readPadState', () => {
  it('returns REST_DPAD when there is no pad', () => {
    expect(readPadState(null)).toEqual(REST_DPAD);
  });

  it('reads each D-pad button independently', () => {
    expect(readPadState(makePad({ buttons: { 12: true } }))).toMatchObject({ up: true });
    expect(readPadState(makePad({ buttons: { 13: true } }))).toMatchObject({ down: true });
    expect(readPadState(makePad({ buttons: { 14: true } }))).toMatchObject({ left: true });
    expect(readPadState(makePad({ buttons: { 15: true } }))).toMatchObject({ right: true });
  });

  it('respects the stick deadzone', () => {
    expect(readPadState(makePad({ axes: [0.4, 0.4] }))).toEqual(REST_DPAD);
  });

  it('translates a strong horizontal stick push into a single horizontal direction', () => {
    expect(readPadState(makePad({ axes: [0.9, 0] }))).toMatchObject({
      right: true,
      left: false,
      up: false,
      down: false,
    });
    expect(readPadState(makePad({ axes: [-0.9, 0] }))).toMatchObject({
      left: true,
      right: false,
    });
  });

  it('translates a strong vertical stick push into a single vertical direction', () => {
    expect(readPadState(makePad({ axes: [0, -0.9] }))).toMatchObject({ up: true, down: false });
    expect(readPadState(makePad({ axes: [0, 0.9] }))).toMatchObject({ down: true, up: false });
  });

  it('breaks diagonal stick ties by larger absolute magnitude', () => {
    const horizontalDominant = readPadState(makePad({ axes: [0.9, 0.7] }));
    expect(horizontalDominant).toMatchObject({ right: true, down: false });
    const verticalDominant = readPadState(makePad({ axes: [0.6, 0.9] }));
    expect(verticalDominant).toMatchObject({ down: true, right: false });
  });
});

describe('useGamepad / diffPadState', () => {
  it('emits nothing when nothing changed', () => {
    expect(diffPadState(REST_DPAD, REST_DPAD)).toEqual([]);
    const held: DpadState = { up: true, down: false, left: false, right: false };
    expect(diffPadState(held, held)).toEqual([]);
  });

  it('emits exactly one event per rest→press transition', () => {
    expect(diffPadState(REST_DPAD, { ...REST_DPAD, up: true })).toEqual(['up']);
    expect(diffPadState(REST_DPAD, { ...REST_DPAD, right: true })).toEqual(['right']);
  });

  it('does not emit on press→release', () => {
    expect(diffPadState({ ...REST_DPAD, up: true }, REST_DPAD)).toEqual([]);
  });

  it('emits all newly pressed directions when multiple change at once', () => {
    const before = REST_DPAD;
    const after: DpadState = { up: true, down: false, left: true, right: false };
    expect(diffPadState(before, after).sort()).toEqual(['left', 'up']);
  });
});
