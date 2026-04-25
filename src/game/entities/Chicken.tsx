import { useCallback, useEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useDirectionalInput } from '../engine/input/useDirectionalInput';
import { useDirectionEvents } from '../engine/input/InputBus';
import { useGamepad } from '../engine/input/useGamepad';
import { HOP_DURATION, arcY, easeOutCubic, squashStretchScale } from '../engine/hop';
import { ChickenModel } from './ChickenModel';
import { DIRECTION_OFFSET, type Direction, type Tile, addTile, tileToWorld } from '../world/grid';
import { isBlocked } from '../world/lanes/occupancy';
import { useWorld } from '../world/lanes/useWorld';

/**
 * Yaw (radians around +Y) the chicken should face after hopping in each
 * direction. The model itself faces `-Z`, so `up` resolves to 0.
 */
const YAW_BY_DIR: Record<Direction, number> = {
  up: 0,
  right: Math.PI / 2,
  down: Math.PI,
  left: -Math.PI / 2,
};

/** Yaw damping stiffness; higher = snappier turn during the hop. */
const YAW_STIFFNESS = 22;

/** Idle bob amplitude (Y-units) and angular frequency (rad/s). */
const IDLE_BOB_AMPLITUDE = 0.02;
const IDLE_BOB_FREQUENCY = 5;

/** Stiffness used to relax the model's squash/stretch back to identity in idle. */
const SCALE_RELAX_STIFFNESS = 18;

const TWO_PI = Math.PI * 2;

/** Damps `current` toward `target` along the shortest arc on the unit circle. */
function dampAngle(current: number, target: number, lambda: number, delta: number): number {
  let diff = target - current;
  diff = ((((diff + Math.PI) % TWO_PI) + TWO_PI) % TWO_PI) - Math.PI;
  return current + (1 - Math.exp(-lambda * delta)) * diff;
}

interface ChickenProps {
  /** Mirror of the chicken's *visible* group position; used by the dev overlay. */
  positionRef: RefObject<THREE.Vector3>;
  /**
   * Destination of the *currently active hop* (or current resting tile when
   * idle), with `y = 0`. The camera follows this clean step function so the
   * Y-bob from hops/idle never bleeds into camera motion.
   */
  cameraTargetRef: RefObject<THREE.Vector3>;
}

/**
 * Phase 3 chicken entity. Owns the hop state machine, a single-slot input
 * queue, yaw damping, and idle bob. All keyboard / touch / gamepad input
 * funnels through `handleDirection` so each source produces identical
 * gameplay.
 *
 * The mesh is split across two refs:
 *   - `groupRef` (outer): position + yaw, mutated each frame.
 *   - `modelRef` (inner, returned by `ChickenModel`): non-uniform scale for
 *     squash/stretch, kept separate so future per-bone tweaks don't fight
 *     the entity's translation.
 */
export function Chicken({ positionRef, cameraTargetRef }: ChickenProps): JSX.Element {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const world = useWorld();

  // Logical state. `currentTile` is where the chicken is right now;
  // `targetTile` is where it will be when the active or queued hop lands.
  const currentTile = useRef<Tile>({ x: 0, z: 0 });
  const targetTile = useRef<Tile>({ x: 0, z: 0 });

  // Active-hop animation state. `hopProgress` runs from 0 to 1 across
  // `HOP_DURATION` seconds; `hopActive` gates the per-frame updates.
  const hopFrom = useMemo(() => new THREE.Vector3(), []);
  const hopTo = useMemo(() => new THREE.Vector3(), []);
  const hopProgress = useRef(0);
  const hopActive = useRef(false);

  // Single-slot input queue. The latest tap during a hop wins.
  const queuedDir = useRef<Direction | null>(null);

  // Yaw state. Tracked manually because `THREE.MathUtils.damp` is linear in
  // angle space and would take the long way around for half-turns.
  const currentYaw = useRef(0);
  const targetYaw = useRef(0);

  // Time accumulator for the idle bob's sin curve.
  const elapsed = useRef(0);

  /** Reused scratch vector to avoid per-frame allocations. */
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const startHop = useCallback(
    (dir: Direction, fromTile: Tile, toTile: Tile) => {
      tileToWorld(fromTile, hopFrom);
      tileToWorld(toTile, hopTo);
      targetTile.current = toTile;
      targetYaw.current = YAW_BY_DIR[dir];
      hopProgress.current = 0;
      hopActive.current = true;
    },
    [hopFrom, hopTo],
  );

  const handleDirection = useCallback(
    (dir: Direction) => {
      const planFrom = hopActive.current ? targetTile.current : currentTile.current;
      const proposed = addTile(planFrom, DIRECTION_OFFSET[dir]);
      if (isBlocked(proposed, world)) return;
      if (hopActive.current) {
        queuedDir.current = dir;
        return;
      }
      startHop(dir, planFrom, proposed);
    },
    [startHop, world],
  );

  useDirectionalInput(handleDirection);
  useDirectionEvents(handleDirection);
  useGamepad(handleDirection);

  // Initial placement so the very first frame doesn't render at the origin
  // before useFrame has had a chance to run.
  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    tileToWorld(currentTile.current, scratch);
    group.position.copy(scratch);
    if (cameraTargetRef.current) cameraTargetRef.current.copy(scratch);
    if (positionRef.current) positionRef.current.copy(scratch);
  }, [cameraTargetRef, positionRef, scratch]);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const model = modelRef.current;
    if (!group) return;

    elapsed.current += delta;

    if (hopActive.current) {
      hopProgress.current = Math.min(1, hopProgress.current + delta / HOP_DURATION);
      const pe = easeOutCubic(hopProgress.current);
      group.position.x = hopFrom.x + (hopTo.x - hopFrom.x) * pe;
      group.position.z = hopFrom.z + (hopTo.z - hopFrom.z) * pe;
      group.position.y = arcY(hopProgress.current);

      if (model) {
        const [sx, sy, sz] = squashStretchScale(hopProgress.current);
        model.scale.set(sx, sy, sz);
      }

      if (hopProgress.current >= 1) {
        hopActive.current = false;
        currentTile.current = { ...targetTile.current };
        const next = queuedDir.current;
        queuedDir.current = null;
        if (next) handleDirection(next);
      }
    } else {
      // Idle: park on the current tile with a subtle vertical bob.
      tileToWorld(currentTile.current, scratch);
      group.position.x = scratch.x;
      group.position.z = scratch.z;
      group.position.y = Math.sin(elapsed.current * IDLE_BOB_FREQUENCY) * IDLE_BOB_AMPLITUDE;

      if (model) {
        const t = 1 - Math.exp(-SCALE_RELAX_STIFFNESS * delta);
        model.scale.x += (1 - model.scale.x) * t;
        model.scale.y += (1 - model.scale.y) * t;
        model.scale.z += (1 - model.scale.z) * t;
      }
    }

    currentYaw.current = dampAngle(currentYaw.current, targetYaw.current, YAW_STIFFNESS, delta);
    group.rotation.y = currentYaw.current;

    if (positionRef.current) positionRef.current.copy(group.position);
    if (cameraTargetRef.current) {
      // Camera follows the *destination* tile (or the resting tile when
      // idle) on the ground plane so the hop arc and idle bob never bleed
      // into camera motion.
      const dest = hopActive.current ? hopTo : tileToWorld(currentTile.current, scratch);
      cameraTargetRef.current.set(dest.x, 0, dest.z);
    }
  });

  return (
    <group ref={groupRef}>
      <ChickenModel ref={modelRef} />
    </group>
  );
}
