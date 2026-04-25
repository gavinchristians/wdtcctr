import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { HALF_WIDTH } from '../world/config';
import { useActiveChunks } from '../world/lanes/useWorld';

const FADE_WIDTH = 2;
const FADE_HEIGHT = 0.04;
const FADE_Y = -FADE_HEIGHT / 2 + 0.001;

/**
 * Visual telegraphing of the playable band edges. Renders two thin dark
 * strips just past x = +/-HALF_WIDTH on every active lane. The actual
 * blocking lives in occupancy.ts; this component is purely cosmetic.
 *
 * Phase 4 will hook real death animations once vehicles can knock the
 * chicken off the band.
 */
export function KillZone(): JSX.Element | null {
  const chunks = useActiveChunks();

  const placements = useMemo(() => {
    const out: Array<{ key: string; position: [number, number, number] }> = [];
    for (const chunk of chunks.values()) {
      for (const lane of chunk.lanes) {
        out.push({
          key: `${lane.z}:l`,
          position: [-(HALF_WIDTH + FADE_WIDTH / 2 + 0.5), FADE_Y, lane.z],
        });
        out.push({
          key: `${lane.z}:r`,
          position: [HALF_WIDTH + FADE_WIDTH / 2 + 0.5, FADE_Y, lane.z],
        });
      }
    }
    return out;
  }, [chunks, chunks.size]);

  if (placements.length === 0) return null;

  return (
    <Instances limit={Math.max(placements.length, 16)} receiveShadow>
      <boxGeometry args={[FADE_WIDTH, FADE_HEIGHT, 1]} />
      <meshStandardMaterial color="#1a1a1a" roughness={1} />
      {placements.map((p) => (
        <Instance key={p.key} position={p.position} />
      ))}
    </Instances>
  );
}
