import { useRef, type RefObject } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Crossy-Road-style camera offset relative to the followed target.
 * The X/Z values control the isometric framing; Y controls the height.
 * Iterate by eye - these are intentionally not exposed as props yet.
 */
const CAMERA_OFFSET = new THREE.Vector3(6, 9, 9);

/**
 * Damping stiffness in 1/seconds. Must match the chicken's SLIDE_STIFFNESS
 * so the camera and mesh advance toward their respective targets at the
 * same rate, keeping the visible chicken-to-camera offset constant during
 * hops. With a lower stiffness the chicken visually pops forward during
 * each hop and then drifts back to center as the camera catches up.
 * THREE.MathUtils.damp is frame-rate independent so this value is stable
 * regardless of refresh rate.
 */
const FOLLOW_STIFFNESS = 38;

interface CameraRigProps {
  /** World position the camera should follow. Read every frame, not at mount. */
  target: RefObject<THREE.Vector3>;
}

export function CameraRig({ target }: CameraRigProps): JSX.Element {
  const cameraRef = useRef<THREE.OrthographicCamera>(null);
  const desired = useRef(new THREE.Vector3());
  const lookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const camera = cameraRef.current;
    const t = target.current;
    if (!camera || !t) return;

    // Forward-bias follow: camera tracks the chicken's forward (Z) progress
    // and vertical (Y) bob, but stays fixed laterally. The chicken can step
    // left/right freely on screen; only forward movement scrolls the world.
    desired.current.set(CAMERA_OFFSET.x, t.y + CAMERA_OFFSET.y, t.z + CAMERA_OFFSET.z);

    camera.position.x = desired.current.x;
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      desired.current.y,
      FOLLOW_STIFFNESS,
      delta,
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      desired.current.z,
      FOLLOW_STIFFNESS,
      delta,
    );

    // Look at the lane the chicken is on, not the chicken itself, so the
    // camera doesn't yaw as the chicken slides sideways.
    lookAt.current.set(0, t.y, t.z);
    camera.lookAt(lookAt.current);
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z]}
      zoom={70}
      near={0.1}
      far={200}
    />
  );
}
