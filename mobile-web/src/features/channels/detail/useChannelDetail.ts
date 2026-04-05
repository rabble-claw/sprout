// ABOUTME: React hook that loads a channel's metadata via the relay REST API.
// ABOUTME: Thin wrapper around getChannelDetails() with loading / error / refetch handling.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChannelDetail } from "@sprout-shared/api/types";
import { getChannelDetails } from "../../../api/relayHttp";

export type UseChannelDetailResult = {
  detail: ChannelDetail | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useChannelDetail(channelId: string): UseChannelDetailResult {
  const [detail, setDetail] = useState<ChannelDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const myId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getChannelDetails(channelId);
      if (!mounted.current || myId !== requestId.current) return;
      setDetail(result);
    } catch (e) {
      if (!mounted.current || myId !== requestId.current) return;
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      if (mounted.current && myId === requestId.current) setLoading(false);
    }
  }, [channelId]);

  useEffect(() => {
    mounted.current = true;
    void load();
    return () => {
      mounted.current = false;
    };
  }, [load]);

  return { detail, loading, error, refetch: load };
}
