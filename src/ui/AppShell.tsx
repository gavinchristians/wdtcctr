import { Scene } from '../game/Scene';

export function AppShell(): JSX.Element {
  return (
    <div data-testid="app-shell" style={{ width: '100%', height: '100%' }}>
      <Scene />
    </div>
  );
}
