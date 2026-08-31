import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Load-once-then-refresh, replacing the web app's
 * server-component-fetch → props → `router.refresh()` cycle.
 *
 * Deliberately not TanStack Query. The original had no client cache at all, and
 * introducing one would change the app's behaviour (background refetch, stale
 * windows, retry) beyond what a migration should. `refresh()` is the direct
 * analogue of `router.refresh()`, and `setData` covers the one place the old
 * code mutated optimistically — the kanban board.
 *
 * Consequence worth knowing: there is still no offline write queue. A failed
 * mutation surfaces its error and the caller re-reads; nothing is retried.
 */
export type AsyncState<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
  refresh: () => Promise<void>;
  setData: (next: T | ((current: T | null) => T | null) | null) => void;
};

export function useAsync<T>(
  load: () => Promise<T>,
  deps: readonly unknown[],
): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Keeps a resolved request from a previous set of deps overwriting a newer
  // one, and from setting state after unmount.
  const generation = useRef(0);

  const loadRef = useRef(load);
  loadRef.current = load;

  const refresh = useCallback(async () => {
    const current = ++generation.current;
    setLoading(true);

    try {
      const next = await loadRef.current();
      if (current === generation.current) {
        setData(next);
        setError(null);
      }
    } catch (err) {
      if (current === generation.current) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      if (current === generation.current) {
        setLoading(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void refresh();
    return () => {
      generation.current += 1;
    };
  }, [refresh]);

  return { data, error, loading, refresh, setData };
}
