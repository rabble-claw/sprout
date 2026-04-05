// ABOUTME: React hook that loads a channel's member roster via the relay REST API.
// ABOUTME: Thin wrapper around getChannelMembers() with loading / error / refetch handling.
import { useCallback, useEffect, useRef, useState } from "react";
import type { ChannelMember } from "@sprout-shared/api/types";
import { getChannelMembers } from "../../../api/relayHttp";

export type UseChannelMembersResult = {
  members: ChannelMember[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useChannelMembers(channelId: string): UseChannelMembersResult {
  const [members, setMembers] = useState<ChannelMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const myId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await getChannelMembers(channelId);
      if (!mounted.current || myId !== requestId.current) return;
      setMembers(result);
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

  return { members, loading, error, refetch: load };
}
