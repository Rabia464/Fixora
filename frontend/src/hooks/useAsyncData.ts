"use client"
import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncData<T> {
  data: T;
  loading: boolean;
  /** Message from the last failed load, or null when the last load succeeded. */
  error: string | null;
  /** Re-run the fetcher (shows the loading state again); use after mutations. */
  reload: () => void;
}

const toMessage = (err: unknown) =>
  err instanceof Error && err.message ? err.message : 'Something went wrong while loading.';

/**
 * Loads data from an async fetcher on mount and exposes a `reload` for
 * refetching after mutations.
 *
 * Failures are surfaced through `error` so pages can show a retry state
 * instead of an empty ("all clear") view that hides the problem.
 *
 * `loading` starts `true` and the mount effect updates state only inside the
 * promise callbacks (never synchronously), which is the idiomatic React pattern
 * and keeps the `react-hooks/set-state-in-effect` rule satisfied. `reload` runs
 * from event handlers, so it may flip the spinner on immediately.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, initialData: T): AsyncData<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let active = true;
    fetcherRef
      .current()
      .then(result => {
        if (active) {
          setData(result);
          setError(null);
        }
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        if (active) setError(toMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const reload = useCallback(() => {
    setLoading(true);
    fetcherRef
      .current()
      .then(result => {
        setData(result);
        setError(null);
      })
      .catch(err => {
        console.error('Failed to load data:', err);
        setError(toMessage(err));
      })
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, error, reload };
}
