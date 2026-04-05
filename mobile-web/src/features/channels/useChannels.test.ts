// ABOUTME: Unit tests for the useChannels hook and its sortChannels helper.
// ABOUTME: Requires vitest + @testing-library/react; excluded from tsc until installed.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Channel } from "@sprout-shared/api/types";
import { sortChannels, useChannels } from "./useChannels";

vi.mock("../../api/relayHttp", () => ({
  getChannels: vi.fn(),
}));

// Re-import after the mock is registered so we can manipulate it per-test.
import * as relayHttp from "../../api/relayHttp";
const getChannelsMock = relayHttp.getChannels as unknown as ReturnType<typeof vi.fn>;

function makeChannel(partial: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    id: partial.id,
    name: partial.name,
    channelType: partial.channelType ?? "stream",
    visibility: partial.visibility ?? "public",
    description: partial.description ?? "",
    topic: partial.topic ?? null,
    purpose: partial.purpose ?? null,
    memberCount: partial.memberCount ?? 0,
    lastMessageAt: partial.lastMessageAt ?? null,
    archivedAt: partial.archivedAt ?? null,
    participants: partial.participants ?? [],
    participantPubkeys: partial.participantPubkeys ?? [],
    isMember: partial.isMember ?? true,
  } as Channel;
}

describe("sortChannels", () => {
  it("groups streams before forums before dms, alphabetically within each group", () => {
    const input: Channel[] = [
      makeChannel({ id: "c", name: "zeta", channelType: "stream" }),
      makeChannel({ id: "a", name: "bravo", channelType: "forum" }),
      makeChannel({ id: "b", name: "alpha", channelType: "dm" }),
      makeChannel({ id: "d", name: "alpha", channelType: "stream" }),
      makeChannel({ id: "e", name: "zulu", channelType: "forum" }),
    ];
    const out = sortChannels(input).map((c) => c.id);
    expect(out).toEqual(["d", "c", "a", "e", "b"]);
  });

  it("de-duplicates by channel id, keeping the last occurrence", () => {
    const input: Channel[] = [
      makeChannel({ id: "dup", name: "first", channelType: "stream" }),
      makeChannel({ id: "dup", name: "second", channelType: "stream" }),
    ];
    const out = sortChannels(input);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe("second");
  });

  it("returns [] for empty input", () => {
    expect(sortChannels([])).toEqual([]);
  });
});

describe("useChannels", () => {
  beforeEach(() => {
    getChannelsMock.mockReset();
  });
  afterEach(() => {
    getChannelsMock.mockReset();
  });

  it("starts in loading state, resolves with sorted channels", async () => {
    const channels = [
      makeChannel({ id: "b", name: "beta", channelType: "stream" }),
      makeChannel({ id: "a", name: "alpha", channelType: "stream" }),
    ];
    getChannelsMock.mockResolvedValueOnce(channels);

    const { result } = renderHook(() => useChannels());
    expect(result.current.loading).toBe(true);
    expect(result.current.channels).toEqual([]);

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
    expect(result.current.channels.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("surfaces fetch errors without clobbering prior channels", async () => {
    getChannelsMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useChannels());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.channels).toEqual([]);
  });

  it("refetch re-runs the request and clears stale error", async () => {
    getChannelsMock.mockRejectedValueOnce(new Error("transient"));
    const channels = [makeChannel({ id: "a", name: "alpha", channelType: "stream" })];
    getChannelsMock.mockResolvedValueOnce(channels);

    const { result } = renderHook(() => useChannels());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    expect(result.current.channels.map((c) => c.id)).toEqual(["a"]);
  });
});
