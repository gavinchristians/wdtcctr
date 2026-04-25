import { Stats } from '@react-three/drei';
import { useKeyToggle } from '../engine/input/useKeyToggle';

/**
 * Press the backtick key (`) to toggle: drei <Stats />, an axes helper,
 * and a tile-aligned grid helper. Off by default. Phase 5 will hide this
 * behind a settings flag, but for now it stays available even in prod
 * builds because it's invaluable when chasing camera or input issues.
 *
 * Note on placement: `<Stats />` mounts a DOM panel via React portal and
 * is intentionally rendered alongside the helpers - drei handles the
 * canvas-vs-DOM split internally.
 */
export function DevOverlay(): JSX.Element | null {
  const visible = useKeyToggle('Backquote', false);
  if (!visible) return null;
  return (
    <>
      <Stats />
      <axesHelper args={[5]} />
      <gridHelper args={[40, 40, '#444444', '#222222']} position={[0, 0.001, 0]} />
    </>
  );
}
