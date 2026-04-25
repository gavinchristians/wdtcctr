import { useRef, type RefObject } from 'react';
import { Stats } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useKeyToggle } from '../engine/input/useKeyToggle';

interface DevOverlayProps {
  /**
   * Live position of whatever the camera is following. The grid helper
   * follows the integer-z component of this so the dev grid stays useful
   * as the world scrolls forward.
   */
  chickenPosition?: RefObject<THREE.Vector3>;
}

/**
 * Press the backtick key (`) to toggle: drei <Stats />, an axes helper,
 * and a tile-aligned grid helper that recenters on the chicken. Off by
 * default. Available in production builds for ad-hoc debugging; Phase 5
 * will hide it behind a settings flag.
 */
export function DevOverlay({ chickenPosition }: DevOverlayProps): JSX.Element | null {
  const visible = useKeyToggle('Backquote', false);
  const gridRef = useRef<THREE.GridHelper>(null);

  useFrame(() => {
    const grid = gridRef.current;
    const target = chickenPosition?.current;
    if (!grid || !target) return;
    grid.position.x = Math.round(target.x);
    grid.position.z = Math.round(target.z);
  });

  if (!visible) return null;
  return (
    <>
      <Stats />
      <axesHelper args={[5]} />
      <gridHelper ref={gridRef} args={[40, 40, '#444444', '#222222']} position={[0, 0.001, 0]} />
    </>
  );
}
