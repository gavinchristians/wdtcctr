import { useCallback, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDirectionalInput } from '../engine/input/useDirectionalInput';
import { DIRECTION_OFFSET, type Direction, type Tile, addTile, tileToWorld } from '../world/grid';
import { isBlocked } from '../world/lanes/occupancy';
import { useWorld } from '../world/lanes/useWorld';

/**
 * Stiffness chosen so a hop reaches ~99% completion in roughly 120 ms,
 * giving the placeholder a snappy-but-readable slide. Phase 3 replaces the
 * lerp with a proper hop arc.
 */
const SLIDE_STIFFNESS = 38;

/** Visible side length of the placeholder cube in world units. */
const CUBE_SIZE = 0.7;

interface PlaceholderChickenProps {
  /**
   * Outwardly mutable ref reflecting the chicken's *visible* mesh position.
   * Use this for visuals tied to the chicken itself (dev overlay, future
   * collision FX, etc.).
   */
  positionRef: RefObject<THREE.Vector3>;
  /**
   * Outwardly mutable ref reflecting the chicken's *target* tile in world
   * units. This is a clean step function (changes only on accepted hops)
   * so anything that smooths it - the camera, in particular - will glide
   * without absorbing the per-hop slide jitter from the visible chicken.
   */
  cameraTargetRef: RefObject<THREE.Vector3>;
}

export function PlaceholderChicken({
  positionRef,
  cameraTargetRef,
}: PlaceholderChickenProps): JSX.Element {
  const meshRef = useRef<THREE.Mesh>(null);
  const currentTile = useRef<Tile>({ x: 0, z: 0 });
  const targetTile = useRef<Tile>({ x: 0, z: 0 });
  const targetWorld = useMemo(() => new THREE.Vector3(), []);
  const world = useWorld();

  const handleDirection = useCallback(
    (dir: Direction) => {
      // Plan a hop from the current logical target so rapid inputs still
      // chain forward correctly (matching Phase 1 behaviour). Reject the
      // input if the next tile is occupied/out-of-bounds; Phase 4 swaps
      // this for a proper queued hop with hazard detection.
      const proposed = addTile(targetTile.current, DIRECTION_OFFSET[dir]);
      if (isBlocked(proposed, world)) {
        return;
      }
      targetTile.current = proposed;
    },
    [world],
  );
  useDirectionalInput(handleDirection);

  useFrame((_, delta) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    // tileToWorld returns y=0; keep the mesh resting on the ground by
    // preserving the cube's vertical offset when interpolating.
    tileToWorld(targetTile.current, targetWorld);
    targetWorld.y = CUBE_SIZE / 2;

    const t = 1 - Math.exp(-SLIDE_STIFFNESS * delta);
    mesh.position.lerp(targetWorld, t);

    if (mesh.position.distanceToSquared(targetWorld) < 1e-6) {
      mesh.position.copy(targetWorld);
      currentTile.current = { ...targetTile.current };
    }

    if (positionRef.current) {
      positionRef.current.copy(mesh.position);
    }
    if (cameraTargetRef.current) {
      cameraTargetRef.current.copy(targetWorld);
    }
  });

  return (
    <mesh ref={meshRef} position={[0, CUBE_SIZE / 2, 0]} castShadow>
      <boxGeometry args={[CUBE_SIZE, CUBE_SIZE, CUBE_SIZE]} />
      <meshStandardMaterial color="#fafafa" />
    </mesh>
  );
}
