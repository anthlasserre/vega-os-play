import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {readState, writeState} from './fileStore';
import {PersistedState, defaultState} from './schema';

interface StoreValue {
  state: PersistedState;
  ready: boolean;
  update: (mutate: (previous: PersistedState) => PersistedState) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

/** Écriture disque groupée : inutile de réécrire à chaque tick de progression. */
const FLUSH_DELAY_MS = 800;

export const StoreProvider = ({children}: {children: React.ReactNode}) => {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<PersistedState | null>(null);

  useEffect(() => {
    let cancelled = false;
    readState().then(loaded => {
      if (!cancelled) {
        setState(loaded);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const flush = useCallback(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (pending.current !== null) {
      const snapshot = pending.current;
      pending.current = null;
      writeState(snapshot);
    }
  }, []);

  const update = useCallback(
    (mutate: (previous: PersistedState) => PersistedState) => {
      setState(previous => {
        const next = mutate(previous);
        pending.current = next;
        if (timer.current !== null) {
          clearTimeout(timer.current);
        }
        timer.current = setTimeout(flush, FLUSH_DELAY_MS);
        return next;
      });
    },
    [flush],
  );

  // Un flush au démontage : sans lui, la dernière position de lecture est perdue
  // si l'app se ferme dans la fenêtre de regroupement.
  useEffect(() => flush, [flush]);

  const value = useMemo(() => ({state, ready, update}), [state, ready, update]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = (): StoreValue => {
  const value = useContext(StoreContext);
  if (value === null) {
    throw new Error('useStore doit être utilisé dans un StoreProvider');
  }
  return value;
};
