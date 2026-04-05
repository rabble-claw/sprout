// ABOUTME: React hook for relay full-text search with debounced query + stale-response guard.
// ABOUTME: Exposes { query, setQuery, hits, found, loading, error } backed by searchMessages().
import { useCallback, useEffect, useRef, useState } from "react";
import type { SearchHit } from "@sprout-shared/api/types";
import { searchMessages } from "../../api/relayHttp";

const DEBOUNCE_MS = 300;

export type UseSearchResult = {
  query: string;
  setQuery: (q: string) => void;
  hits: SearchHit[];
  found: number;
  loading: boolean;
  error: Error | null;
};

export function useSearch(): UseSearchResult {
  const [query, setQueryState] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [found, setFound] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed === "") {
      // Invalidate any in-flight request and reset visible state.
      requestId.current += 1;
      setHits((prev) => (prev.length === 0 ? prev : []));
      setFound(0);
      setLoading(false);
      setError(null);
      return;
    }

    const timer = setTimeout(() => {
      const myId = ++requestId.current;
      setLoading(true);
      setError(null);
      searchMessages({ q: trimmed })
        .then((res) => {
          if (!mounted.current || myId !== requestId.current) return;
          setHits(res.hits);
          setFound(res.found);
          setLoading(false);
        })
        .catch((e) => {
          if (!mounted.current || myId !== requestId.current) return;
          setError(e instanceof Error ? e : new Error(String(e)));
          setHits([]);
          setFound(0);
          setLoading(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  return { query, setQuery, hits, found, loading, error };
}
