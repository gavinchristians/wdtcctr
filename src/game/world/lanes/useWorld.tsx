import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { FINITE_LENGTH, WORLD_SEED } from '../config';
import { createFiniteWorldSource, type WorldSource } from './chunkManager';
import type { Chunk } from './types';

const WorldContext = createContext<WorldSource | null>(null);

interface WorldProviderProps {
  children: ReactNode;
  seed?: number;
  length?: number;
}

/**
 * Mounts a single WorldSource for the subtree. Phase 5 will swap the
 * finite implementation for an endless one with no API change.
 */
export function WorldProvider({
  children,
  seed = WORLD_SEED,
  length = FINITE_LENGTH,
}: WorldProviderProps): JSX.Element {
  const world = useMemo(() => createFiniteWorldSource(seed, length), [seed, length]);

  useEffect(() => {
    world.ensureWindow(0);
  }, [world]);

  return <WorldContext.Provider value={world}>{children}</WorldContext.Provider>;
}

/** Returns the WorldSource bound by the nearest WorldProvider. */
// eslint-disable-next-line react-refresh/only-export-components
export function useWorld(): WorldSource {
  const world = useContext(WorldContext);
  if (!world) {
    throw new Error('useWorld() must be used inside a <WorldProvider>.');
  }
  return world;
}

/**
 * Subscribes to active-chunk changes. The snapshot is the chunk count;
 * `useSyncExternalStore` triggers a re-render whenever it changes, after
 * which the live `activeChunks` map is returned. Phase 5 (eviction) will
 * replace this with a real version counter, but for Phase 2 the chunk
 * count only ever grows, so it's sufficient.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useActiveChunks(): ReadonlyMap<number, Chunk> {
  const world = useWorld();
  useSyncExternalStore(
    (listener) => world.subscribe(listener),
    () => world.activeChunks.size,
    () => 0,
  );
  return world.activeChunks;
}
