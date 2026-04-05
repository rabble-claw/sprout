// ABOUTME: React hook that loads the current user's profile via the relay REST API.
// ABOUTME: Thin wrapper around getProfile() with loading / error / refetch handling.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Profile } from "@sprout-shared/api/types";
import { getProfile } from "../../api/relayHttp";

export type UseProfileResult = {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useProfile(): UseProfileResult {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProfile();
      if (!mounted.current) return;
      setProfile(result);
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

  return { profile, loading, error, refetch: load };
}
