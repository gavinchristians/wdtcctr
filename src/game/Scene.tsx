import { useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './scene/CameraRig';
import { DevOverlay } from './scene/DevOverlay';
import { KillZone } from './scene/KillZone';
import { Lanes } from './scene/Lanes';
import { Lights } from './scene/Lights';
import { Obstacles } from './scene/Obstacles';
import { PlaceholderChicken } from './entities/PlaceholderChicken';
import { WorldProvider } from './world/lanes/useWorld';

const FOG_COLOR = '#bfe4ff';

/**
 * Top-level Three.js scene. Owns the shared chicken position ref so the
 * camera can follow the placeholder without relying on a global store.
 * The WorldProvider mounts a single procedural-world instance for every
 * downstream component to read.
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

      <WorldProvider>
        <CameraRig target={chickenPosition} />
        <Lights />
        <Lanes />
        <Obstacles />
        <KillZone />
        <PlaceholderChicken positionRef={chickenPosition} />
        <DevOverlay chickenPosition={chickenPosition} />
      </WorldProvider>
    </Canvas>
  );
}
