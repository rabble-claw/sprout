// ABOUTME: React hook that loads the current user's channels via the relay REST API.
// ABOUTME: Exposes {channels, loading, error, refetch} with client-side sorting by type + name.
import { useCallback, useEffect, useRef, useState } from "react";
import type { Channel } from "@sprout-shared/api/types";
import { getChannels } from "../../api/relayHttp";

const CHANNEL_TYPE_ORDER: Record<string, number> = {
  stream: 0,
  forum: 1,
  dm: 2,
};

export function sortChannels(channels: Channel[]): Channel[] {
  const unique = new Map<string, Channel>();
  for (const channel of channels) unique.set(channel.id, channel);
  return [...unique.values()].sort((left, right) => {
    const typeOrder =
      (CHANNEL_TYPE_ORDER[left.channelType] ?? 99) -
      (CHANNEL_TYPE_ORDER[right.channelType] ?? 99);
    if (typeOrder !== 0) return typeOrder;
    return left.name.localeCompare(right.name);
  });
}

export type UseChannelsResult = {
  channels: Channel[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

export function useChannels(): UseChannelsResult {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getChannels();
      if (!mounted.current) return;
      setChannels(sortChannels(result));
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

  return { channels, loading, error, refetch: load };
}
