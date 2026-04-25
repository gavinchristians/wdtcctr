import { useMemo } from 'react';
import { Instance, Instances } from '@react-three/drei';
import { LANE_WIDTH } from '../world/config';
import { useActiveChunks } from '../world/lanes/useWorld';
import type { Lane, LaneKind } from '../world/lanes/types';

const LANE_COLORS: Record<LaneKind, string> = {
  grass: '#7ec850',
  road: '#3a3a3a',
  water: '#4a90c4',
  rail: '#8b6f4e',
};

/**
 * Lane slabs are 5 cm thick boxes so they can cast/receive shadows and
 * sit comfortably on `y = 0` without z-fighting against helpers.
 */
const SLAB_HEIGHT = 0.05;
const SLAB_Y = -SLAB_HEIGHT / 2;

function laneKey(lane: Lane): string {
  return `${lane.kind}:${lane.z}`;
}

interface LaneStripsProps {
  kind: LaneKind;
  lanes: Lane[];
}

function LaneStrips({ kind, lanes }: LaneStripsProps): JSX.Element | null {
  if (lanes.length === 0) return null;
  return (
    <Instances limit={Math.max(lanes.length, 16)} receiveShadow>
      <boxGeometry args={[LANE_WIDTH, SLAB_HEIGHT, 1]} />
      <meshStandardMaterial color={LANE_COLORS[kind]} roughness={0.95} />
      {lanes.map((lane) => (
        <Instance key={laneKey(lane)} position={[0, SLAB_Y, lane.z]} />
      ))}
    </Instances>
  );
}

/** Road center stripes - small white dashes baked as instanced slabs. */
function RoadStripes({ lanes }: { lanes: Lane[] }): JSX.Element | null {
  const dashes = useMemo(() => {
    const out: Array<{ key: string; position: [number, number, number] }> = [];
    const dashCount = 4;
    const stride = LANE_WIDTH / dashCount;
    for (const lane of lanes) {
      for (let i = 0; i < dashCount; i += 1) {
        const x = -LANE_WIDTH / 2 + stride * (i + 0.5);
        out.push({
          key: `${lane.z}:${i}`,
          position: [x, SLAB_HEIGHT / 2 + 0.001, lane.z],
        });
      }
    }
    return out;
  }, [lanes]);

  if (dashes.length === 0) return null;

  return (
    <Instances limit={Math.max(dashes.length, 16)}>
      <boxGeometry args={[0.4, 0.01, 0.08]} />
      <meshStandardMaterial color="#f5f1c8" roughness={0.6} />
      {dashes.map((d) => (
        <Instance key={d.key} position={d.position} />
      ))}
    </Instances>
  );
}

/** Two darker rail strips inset on each rail lane. */
function Rails({ lanes }: { lanes: Lane[] }): JSX.Element | null {
  const rails = useMemo(() => {
    const out: Array<{ key: string; position: [number, number, number] }> = [];
    for (const lane of lanes) {
      out.push({ key: `${lane.z}:l`, position: [-0.35, SLAB_HEIGHT / 2 + 0.005, lane.z] });
      out.push({ key: `${lane.z}:r`, position: [0.35, SLAB_HEIGHT / 2 + 0.005, lane.z] });
    }
    return out;
  }, [lanes]);

  if (rails.length === 0) return null;

  return (
    <Instances limit={Math.max(rails.length, 16)}>
      <boxGeometry args={[0.08, 0.04, 1]} />
      <meshStandardMaterial color="#3b3b3b" metalness={0.3} roughness={0.6} />
      {rails.map((r) => (
        <Instance key={r.key} position={r.position} />
      ))}
    </Instances>
  );
}

/**
 * Paints the entire world as colored slabs grouped by lane kind. Each
 * group is a single instanced draw so adding lanes stays O(1) on the GPU.
 */
export function Lanes(): JSX.Element {
  const chunks = useActiveChunks();

  const byKind = useMemo(() => {
    const map: Record<LaneKind, Lane[]> = { grass: [], road: [], water: [], rail: [] };
    for (const chunk of chunks.values()) {
      for (const lane of chunk.lanes) {
        map[lane.kind].push(lane);
      }
    }
    return map;
    // chunks is a stable Map ref whose contents mutate; `chunks.size` is the
    // useSyncExternalStore snapshot that drives re-renders, so include it
    // explicitly so this memo invalidates when chunks fill in.
  }, [chunks, chunks.size]);

  return (
    <group>
      <LaneStrips kind="grass" lanes={byKind.grass} />
      <LaneStrips kind="road" lanes={byKind.road} />
      <LaneStrips kind="water" lanes={byKind.water} />
      <LaneStrips kind="rail" lanes={byKind.rail} />
      <RoadStripes lanes={byKind.road} />
      <Rails lanes={byKind.rail} />
    </group>
  );
}
