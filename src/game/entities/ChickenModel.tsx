import { forwardRef } from 'react';
import * as THREE from 'three';

/**
 * Total height of the chicken model from feet to comb tip, in world units.
 * Phase 3 sizes the chicken so the body fits comfortably inside one tile
 * without overflow, while staying tall enough to read at the standard
 * camera angle.
 */
export const CHICKEN_HEIGHT = 0.96;

const COLOR_BODY = '#fafafa';
const COLOR_BEAK = '#ff9a3c';
const COLOR_COMB = '#d62828';
const COLOR_LEGS = '#f4b400';
const COLOR_EYES = '#1a1a1a';

/**
 * Hand-built voxel chicken assembled from box primitives. The model faces
 * `-Z` so a yaw of `0` aligns with the "up" hop direction. Keeping the mesh
 * to a single component (no GLTF loader, no asset pipeline) lets Phase 3
 * iterate quickly; Phase 6/7 polish can swap this for a baked GLTF without
 * touching the entity layer.
 *
 * The forwarded ref attaches to the outer group so the entity layer can
 * apply hop translation, yaw, and squash/stretch in one place.
 */
export const ChickenModel = forwardRef<THREE.Group>(
  function ChickenModel(_props, ref): JSX.Element {
    return (
      <group ref={ref}>
        {/* Legs (yellow) - feet at y=0 so the group origin sits on the ground. */}
        <mesh position={[-0.1, 0.1, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color={COLOR_LEGS} />
        </mesh>
        <mesh position={[0.1, 0.1, 0.05]} castShadow>
          <boxGeometry args={[0.08, 0.2, 0.08]} />
          <meshStandardMaterial color={COLOR_LEGS} />
        </mesh>

        {/* Body */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.5, 0.4, 0.6]} />
          <meshStandardMaterial color={COLOR_BODY} />
        </mesh>

        {/* Head, perched above body and pushed slightly forward (-Z). */}
        <mesh position={[0, 0.75, -0.2]} castShadow>
          <boxGeometry args={[0.34, 0.34, 0.34]} />
          <meshStandardMaterial color={COLOR_BODY} />
        </mesh>

        {/* Beak - small orange wedge sticking out the front of the head. */}
        <mesh position={[0, 0.72, -0.42]} castShadow>
          <boxGeometry args={[0.12, 0.08, 0.16]} />
          <meshStandardMaterial color={COLOR_BEAK} />
        </mesh>

        {/* Wattle (red, just below the beak). */}
        <mesh position={[0, 0.6, -0.4]} castShadow>
          <boxGeometry args={[0.1, 0.08, 0.06]} />
          <meshStandardMaterial color={COLOR_COMB} />
        </mesh>

        {/* Comb (red) - perched on top of the head, slightly forward. */}
        <mesh position={[0, 0.96, -0.18]} castShadow>
          <boxGeometry args={[0.18, 0.12, 0.08]} />
          <meshStandardMaterial color={COLOR_COMB} />
        </mesh>

        {/* Eyes - small black cubes, one on each side of the head. */}
        <mesh position={[-0.13, 0.78, -0.3]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color={COLOR_EYES} />
        </mesh>
        <mesh position={[0.13, 0.78, -0.3]} castShadow>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color={COLOR_EYES} />
        </mesh>
      </group>
    );
  },
);
