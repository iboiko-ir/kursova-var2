import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from './api.js';

export function useApiData(path, queryParameters) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [reloadCount, setReloadCount] = useState(0);
  const serializedParameters = JSON.stringify(queryParameters);

  useEffect(() => {
    let active = true;
    setState((previousState) => ({ ...previousState, loading: true, error: null }));
    apiRequest(path, { params: JSON.parse(serializedParameters) })
      .then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error }));
    return () => {
      active = false;
    };
  }, [path, serializedParameters, reloadCount]);

  const reload = useCallback(() => setReloadCount((count) => count + 1), []);
  return { ...state, reload };
}

export function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}
