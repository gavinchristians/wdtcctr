import { useRef, type RefObject } from 'react';
import { OrthographicCamera } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Crossy-Road-style camera offset relative to the followed target.
 * The X/Z values control the isometric framing; Y controls the height.
 * Iterate by eye - these are intentionally not exposed as props yet.
 */
const CAMERA_OFFSET = new THREE.Vector3(8, 12, 12);

/**
 * Damping stiffness in 1/seconds. Larger values snap to the target more
 * aggressively. ~6 gives a soft Crossy-Road feel: visibly smooth without
 * feeling laggy. THREE.MathUtils.damp is frame-rate independent so this
 * value is stable regardless of refresh rate.
 */
const FOLLOW_STIFFNESS = 6;

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

    desired.current.copy(t).add(CAMERA_OFFSET);

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      desired.current.x,
      FOLLOW_STIFFNESS,
      delta,
    );
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

    lookAt.current.copy(t);
    camera.lookAt(lookAt.current);
  });

  return (
    <OrthographicCamera
      ref={cameraRef}
      makeDefault
      position={[CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z]}
      zoom={40}
      near={0.1}
      far={200}
    />
  );
}
