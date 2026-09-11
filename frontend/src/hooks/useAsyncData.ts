"use client"
import { useCallback, useEffect, useRef, useState } from 'react';

interface AsyncData<T> {
  data: T;
  loading: boolean;
  /** Re-run the fetcher (shows the loading state again); use after mutations. */
  reload: () => void;
}

/**
 * Loads data from an async fetcher on mount and exposes a `reload` for
 * refetching after mutations.
 *
 * `loading` starts `true` and the mount effect updates state only inside the
 * promise callbacks (never synchronously), which is the idiomatic React pattern
 * and keeps the `react-hooks/set-state-in-effect` rule satisfied. `reload` runs
 * from event handlers, so it may flip the spinner on immediately.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, initialData: T): AsyncData<T> {
  const [data, setData] = useState<T>(initialData);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let active = true;
    fetcherRef
      .current()
      .then(result => {
        if (active) setData(result);
      })
      .catch(err => console.error('Failed to load data:', err))
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
      .then(setData)
      .catch(err => console.error('Failed to load data:', err))
      .finally(() => setLoading(false));
  }, []);

  return { data, loading, reload };
}
