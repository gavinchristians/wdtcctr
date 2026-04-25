import { useCallback, useRef, type ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraRig } from './scene/CameraRig';
import { DevOverlay } from './scene/DevOverlay';
import { KillZone } from './scene/KillZone';
import { Lanes } from './scene/Lanes';
import { Lights } from './scene/Lights';
import { Obstacles } from './scene/Obstacles';
import { Chicken } from './entities/Chicken';
import { InputBusProvider, useInputBus } from './engine/input/InputBus';
import { useTouchSwipe } from './engine/input/useTouchSwipe';
import { WorldProvider } from './world/lanes/useWorld';

const FOG_COLOR = '#bfe4ff';

/**
 * Captures swipe gestures on a full-size DOM wrapper around the canvas and
 * forwards them onto the InputBus so the in-canvas chicken can react via
 * `useDirectionEvents`. Gestures are DOM-side and can't be attached to R3F
 * primitives, hence the dedicated wrapper.
 */
function TouchInputLayer({ children }: { children: ReactNode }): JSX.Element {
  const bus = useInputBus();
  const bind = useTouchSwipe(useCallback((dir) => bus.publish(dir), [bus]));
  return (
    <div
      {...bind()}
      style={{
        width: '100%',
        height: '100%',
        touchAction: 'none',
      }}
    >
      {children}
    </div>
  );
}

/**
 * Top-level Three.js scene. Owns the shared chicken position and camera
 * target refs so the camera can follow the chicken without relying on a
 * global store. The InputBus lives at the very top so DOM-side gesture
 * wrappers and in-canvas subscribers share one channel; the WorldProvider
 * mounts a single procedural-world instance for every downstream component
 * to read.
 */
export function Scene(): JSX.Element {
  const chickenPosition = useRef(new THREE.Vector3(0, 0, 0));
  const cameraTarget = useRef(new THREE.Vector3(0, 0, 0));

  return (
    <InputBusProvider>
      <TouchInputLayer>
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
            <CameraRig target={cameraTarget} />
            <Lights />
            <Lanes />
            <Obstacles />
            <KillZone />
            <Chicken positionRef={chickenPosition} cameraTargetRef={cameraTarget} />
            <DevOverlay chickenPosition={chickenPosition} />
          </WorldProvider>
        </Canvas>
      </TouchInputLayer>
    </InputBusProvider>
  );
}
