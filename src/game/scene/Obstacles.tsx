import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { useActiveChunks } from '../world/lanes/useWorld';

interface Placement {
  key: string;
  position: [number, number, number];
}

const TRUNK_HEIGHT = 0.3;
const FOLIAGE_HEIGHT = 0.9;
const ROCK_HEIGHT = 0.5;

/**
 * Two `<Instances>` groups per obstacle kind: trees split into trunk
 * (cylinder) and foliage (cone) so each is a single instanced draw call;
 * rocks are flattened cubes. All rendered at the obstacle's tile center.
 */
export function Obstacles(): JSX.Element {
  const chunks = useActiveChunks();

  const { trees, rocks } = useMemo(() => {
    const treesOut: Placement[] = [];
    const rocksOut: Placement[] = [];
    for (const chunk of chunks.values()) {
      for (const lane of chunk.lanes) {
        for (const obstacle of lane.obstacles) {
          const key = `${lane.z}:${obstacle.x}`;
          if (obstacle.kind === 'tree') {
            treesOut.push({ key, position: [obstacle.x, 0, lane.z] });
          } else {
            rocksOut.push({ key, position: [obstacle.x, 0, lane.z] });
          }
        }
      }
    }
    return { trees: treesOut, rocks: rocksOut };
  }, [chunks, chunks.size]);

  return (
    <group>
      {trees.length > 0 && (
        <>
          <Instances limit={Math.max(trees.length, 16)} castShadow receiveShadow>
            <cylinderGeometry args={[0.12, 0.16, TRUNK_HEIGHT, 8]} />
            <meshStandardMaterial color="#5a3b1f" roughness={0.9} />
            {trees.map((t) => (
              <Instance
                key={`trunk:${t.key}`}
                position={[t.position[0], TRUNK_HEIGHT / 2, t.position[2]]}
              />
            ))}
          </Instances>
          <Instances limit={Math.max(trees.length, 16)} castShadow receiveShadow>
            <coneGeometry args={[0.42, FOLIAGE_HEIGHT, 8]} />
            <meshStandardMaterial color="#3f6e2c" roughness={0.85} />
            {trees.map((t) => (
              <Instance
                key={`foliage:${t.key}`}
                position={[t.position[0], TRUNK_HEIGHT + FOLIAGE_HEIGHT / 2, t.position[2]]}
              />
            ))}
          </Instances>
        </>
      )}
      {rocks.length > 0 && (
        <Instances limit={Math.max(rocks.length, 16)} castShadow receiveShadow>
          <boxGeometry args={[0.55, ROCK_HEIGHT, 0.55]} />
          <meshStandardMaterial color="#7d7d7d" roughness={0.85} />
          {rocks.map((r) => (
            <Instance
              key={`rock:${r.key}`}
              position={[r.position[0], ROCK_HEIGHT / 2, r.position[2]]}
            />
          ))}
        </Instances>
      )}
    </group>
  );
}
