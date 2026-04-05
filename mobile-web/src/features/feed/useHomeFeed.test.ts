// ABOUTME: Unit tests for the useHomeFeed hook and sortNewestFirst helper.
// ABOUTME: Mocks relayHttp.getHomeFeed to exercise loading / success / error flows.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { FeedItem, HomeFeedResponse } from "@sprout-shared/api/types";
import { sortNewestFirst, useHomeFeed } from "./useHomeFeed";

vi.mock("../../api/relayHttp", () => ({
  getHomeFeed: vi.fn(),
}));

import * as relayHttp from "../../api/relayHttp";
const getHomeFeedMock = relayHttp.getHomeFeed as unknown as ReturnType<typeof vi.fn>;

function makeItem(id: string, createdAt: number, category: FeedItem["category"] = "mention"): FeedItem {
  return {
    id,
    kind: 1,
    pubkey: "pub",
    content: `message ${id}`,
    createdAt,
    channelId: "channel-1",
    channelName: "general",
    tags: [],
    category,
  };
}

function makeResponse(partial?: Partial<HomeFeedResponse["feed"]>): HomeFeedResponse {
  return {
    feed: {
      mentions: partial?.mentions ?? [],
      needsAction: partial?.needsAction ?? [],
      activity: partial?.activity ?? [],
      agentActivity: partial?.agentActivity ?? [],
    },
    meta: { since: 0, total: 0, generatedAt: 123 },
  };
}

describe("sortNewestFirst", () => {
  it("returns items ordered by createdAt descending", () => {
    const items = [makeItem("a", 100), makeItem("b", 300), makeItem("c", 200)];
    expect(sortNewestFirst(items).map((i) => i.id)).toEqual(["b", "c", "a"]);
  });

  it("does not mutate the input array", () => {
    const items = [makeItem("a", 100), makeItem("b", 200)];
    const snapshot = items.map((i) => i.id);
    sortNewestFirst(items);
    expect(items.map((i) => i.id)).toEqual(snapshot);
  });
});

describe("useHomeFeed", () => {
  beforeEach(() => {
    getHomeFeedMock.mockReset();
  });

  it("loads the feed and sorts each section newest-first", async () => {
    getHomeFeedMock.mockResolvedValueOnce(
      makeResponse({
        mentions: [makeItem("m1", 100), makeItem("m2", 300), makeItem("m3", 200)],
        activity: [makeItem("a1", 50), makeItem("a2", 75)],
      }),
    );

    const { result } = renderHook(() => useHomeFeed());
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.feed.mentions.map((i) => i.id)).toEqual(["m2", "m3", "m1"]);
    expect(result.current.feed.activity.map((i) => i.id)).toEqual(["a2", "a1"]);
    expect(result.current.meta?.generatedAt).toBe(123);
    expect(result.current.error).toBeNull();
  });

  it("surfaces fetch errors and keeps the empty feed shape", async () => {
    getHomeFeedMock.mockRejectedValueOnce(new Error("nope"));
    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("nope");
    expect(result.current.feed.mentions).toEqual([]);
    expect(result.current.feed.needsAction).toEqual([]);
  });

  it("refetch clears the previous error", async () => {
    getHomeFeedMock.mockRejectedValueOnce(new Error("first"));
    getHomeFeedMock.mockResolvedValueOnce(
      makeResponse({ mentions: [makeItem("m1", 10)] }),
    );

    const { result } = renderHook(() => useHomeFeed());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    expect(result.current.feed.mentions.map((i) => i.id)).toEqual(["m1"]);
  });
});
