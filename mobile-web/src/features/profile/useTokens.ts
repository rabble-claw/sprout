// ABOUTME: React hook that loads the current user's API tokens via the relay REST endpoint.
// ABOUTME: Tokens are sorted most-recently-created first; revoked tokens are filtered out.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Token } from "@sprout-shared/api/types";
import { listTokens } from "../../api/relayHttp";

export function sortTokens(tokens: Token[]): Token[] {
  return [...tokens]
    .filter((t) => !t.revokedAt)
    .sort((a, b) => {
      const aTs = Date.parse(a.createdAt);
      const bTs = Date.parse(b.createdAt);
      const aOk = Number.isNaN(aTs) ? 0 : aTs;
      const bOk = Number.isNaN(bTs) ? 0 : bTs;
      return bOk - aOk;
    });
}

export type UseTokensResult = {
  tokens: Token[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useTokens(): UseTokensResult {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listTokens();
      if (!mounted.current) return;
      setTokens(sortTokens(result));
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { tokens, loading, error, refetch: load };
}
