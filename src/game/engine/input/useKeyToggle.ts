import { useEffect, useState } from 'react';

/**
 * Returns a boolean that flips every time the user presses the key whose
 * `KeyboardEvent.code` matches `code` (e.g. `'Backquote'` for the backtick).
 * Auto-repeating keydowns are ignored.
 */
export function useKeyToggle(code: string, initial = false): boolean {
  const [on, setOn] = useState(initial);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code !== code) return;
      event.preventDefault();
      setOn((prev) => !prev);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [code]);

  return on;
}
