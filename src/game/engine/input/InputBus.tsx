import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { Direction } from '../../world/grid';

/**
 * Pub-sub for normalized direction events. Lets DOM-side input wrappers
 * (touch-swipe div, future on-screen buttons) live at the canvas root while
 * game-side consumers (`Chicken.tsx`) subscribe from inside `<Canvas>` —
 * which can't see DOM events on its parent. Keyboard and gamepad don't need
 * the bus (they're `window`-scoped) but they ride on it for consistency.
 *
 * The bus is intentionally tiny: a `Set<(dir) => void>` plus a publish
 * helper. No buffering, no batching - the entity layer's input queue is the
 * authoritative place for that.
 */
export interface InputBus {
  publish: (dir: Direction) => void;
  subscribe: (listener: (dir: Direction) => void) => () => void;
}

function createInputBus(): InputBus {
  const listeners = new Set<(dir: Direction) => void>();
  return {
    publish(dir) {
      listeners.forEach((fn) => fn(dir));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

const InputBusContext = createContext<InputBus | null>(null);

interface InputBusProviderProps {
  children: ReactNode;
}

export function InputBusProvider({ children }: InputBusProviderProps): JSX.Element {
  const bus = useMemo(() => createInputBus(), []);
  return <InputBusContext.Provider value={bus}>{children}</InputBusContext.Provider>;
}

/** Returns the bus bound by the nearest `<InputBusProvider>`. */
// eslint-disable-next-line react-refresh/only-export-components
export function useInputBus(): InputBus {
  const bus = useContext(InputBusContext);
  if (!bus) {
    throw new Error('useInputBus() must be used inside an <InputBusProvider>.');
  }
  return bus;
}

/**
 * Subscribes to direction events for the lifetime of the calling component.
 * The handler is captured once per change so consumers can pass a stable
 * `useCallback` without re-subscribing every render.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useDirectionEvents(handler: (dir: Direction) => void): void {
  const bus = useInputBus();
  useEffect(() => bus.subscribe(handler), [bus, handler]);
}
