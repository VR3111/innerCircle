/* useAsync — lightweight fetcher with loading/error, for scaffolding screens that will be backend-wired later. */
import { useEffect, useState } from 'react';

export type AsyncStatus = 'loading' | 'ready' | 'error';

export function useAsync<T>(fetcher: () => Promise<T>, deps: React.DependencyList = []): {
  status: AsyncStatus;
  data: T | null;
  error: Error | null;
  refetch: () => void;
} {
  const [state, setState] = useState<{ status: AsyncStatus; data: T | null; error: Error | null }>({
    status: 'loading', data: null, error: null,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState(s => ({ ...s, status: 'loading', error: null }));
    fetcher()
      .then(d => { if (!cancelled) setState({ status: 'ready', data: d, error: null }); })
      .catch(e => { if (!cancelled) setState({ status: 'error', data: null, error: e as Error }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { ...state, refetch: () => setTick(t => t + 1) };
}
