import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './scene/CameraRig';
import { DevOverlay } from './scene/DevOverlay';
import { Ground } from './scene/Ground';
import { Lights } from './scene/Lights';
import { PlaceholderChicken } from './entities/PlaceholderChicken';

const FOG_COLOR = '#bfe4ff';

/**
 * Top-level Three.js scene. Owns the shared chicken position ref so the
 * camera can follow the placeholder without relying on a global store.
 * Phase 5 will replace this ref with a Zustand selector.
 */
export function Scene(): JSX.Element {
  const chickenPosition = useRef(new THREE.Vector3(0, 0, 0));

  return (
    <Canvas
      data-testid="game-canvas"
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        outputColorSpace: THREE.SRGBColorSpace,
      }}
      style={{ width: '100%', height: '100%', display: 'block' }}
    >
      <color attach="background" args={[FOG_COLOR]} />
      <fog attach="fog" args={[FOG_COLOR, 30, 80]} />

      <CameraRig target={chickenPosition} />
      <Lights />
      <Ground />
      <PlaceholderChicken positionRef={chickenPosition} />
      <DevOverlay />
    </Canvas>
  );
}
