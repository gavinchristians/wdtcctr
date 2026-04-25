import { Canvas } from '@react-three/fiber';
import { OrthographicCamera } from '@react-three/drei';
import * as THREE from 'three';

const FOG_COLOR = '#bfe4ff';
const GROUND_COLOR = '#7ec850';

export function Scene(): JSX.Element {
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

      <OrthographicCamera makeDefault position={[20, 20, 20]} zoom={40} near={0.1} far={200} />

      <hemisphereLight args={['#bfe4ff', '#3a5a2a', 0.6]} />
      <directionalLight
        castShadow
        position={[10, 18, 6]}
        intensity={1.2}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color={GROUND_COLOR} />
      </mesh>
    </Canvas>
  );
}
