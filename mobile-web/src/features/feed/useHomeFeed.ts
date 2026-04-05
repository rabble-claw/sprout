// ABOUTME: React hook that loads the user's home feed via the relay REST API.
// ABOUTME: Exposes {feed, meta, loading, error, refetch} and pre-sorts items newest-first.
import { useCallback, useEffect, useRef, useState } from "react";
import type { FeedItem, HomeFeed, HomeFeedMeta } from "@sprout-shared/api/types";
import { getHomeFeed } from "../../api/relayHttp";

export function sortNewestFirst(items: FeedItem[]): FeedItem[] {
  return [...items].sort((a, b) => b.createdAt - a.createdAt);
}

function sortHomeFeed(feed: HomeFeed): HomeFeed {
  return {
    mentions: sortNewestFirst(feed.mentions),
    needsAction: sortNewestFirst(feed.needsAction),
    activity: sortNewestFirst(feed.activity),
    agentActivity: sortNewestFirst(feed.agentActivity),
  };
}

export type UseHomeFeedResult = {
  feed: HomeFeed;
  meta: HomeFeedMeta | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
};

const EMPTY_FEED: HomeFeed = { mentions: [], needsAction: [], activity: [], agentActivity: [] };

export function useHomeFeed(): UseHomeFeedResult {
  const [feed, setFeed] = useState<HomeFeed>(EMPTY_FEED);
  const [meta, setMeta] = useState<HomeFeedMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getHomeFeed();
      if (!mounted.current) return;
      setFeed(sortHomeFeed(result.feed));
      setMeta(result.meta);
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

  return { feed, meta, loading, error, refetch: load };
}
