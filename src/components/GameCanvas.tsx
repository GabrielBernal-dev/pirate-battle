import { useEffect, useRef, useState } from 'react';

import { Game } from '../game/Game';

export function GameCanvas() {
  const hostRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const host = hostRef.current;

    if (!host) {
      return;
    }

    let cancelled = false;
    const game = new Game();

    const start = async () => {
      try {
        await game.init(host);

        if (!cancelled) {
          setLoading(false);
        }
      } catch (cause) {
        console.error(cause);

        if (!cancelled) {
          setError('Unable to load game assets.');
          setLoading(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      game.destroy();
    };
  }, []);

  return (
    <div className="game-shell">
      <div ref={hostRef} className="game-canvas" />

      {loading && (
        <div className="game-overlay">
          Loading battle...
        </div>
      )}

      {error && (
        <div className="game-overlay game-error">
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="controls-hint">
          W / ↑ Move
          <span>•</span>
          A / ← Turn Left
          <span>•</span>
          D / → Turn Right
        </div>
      )}
    </div>
  );
}