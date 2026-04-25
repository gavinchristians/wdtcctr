const GROUND_COLOR = '#7ec850';

/**
 * Flat green ground plane that stands in for the world while procedural
 * terrain is still on the roadmap. Sized large enough that the camera never
 * sees its edges at the current zoom.
 */
export function Ground(): JSX.Element {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[200, 200]} />
      <meshStandardMaterial color={GROUND_COLOR} />
    </mesh>
  );
}
