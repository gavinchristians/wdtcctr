/**
 * Sun + sky lighting shared by all scenes. Behaviour is intentionally
 * identical to the original inline lights in Scene.tsx; this module just
 * makes them composable.
 */
export function Lights(): JSX.Element {
  return (
    <>
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
    </>
  );
}
