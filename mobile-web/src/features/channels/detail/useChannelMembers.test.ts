// ABOUTME: Unit tests for useChannelMembers — loading / success / error / refetch.
// ABOUTME: Mocks relayHttp.getChannelMembers so no network is touched.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ChannelMember } from "@sprout-shared/api/types";
import { useChannelMembers } from "./useChannelMembers";

vi.mock("../../../api/relayHttp", () => ({
  getChannelMembers: vi.fn(),
}));

import * as relayHttp from "../../../api/relayHttp";
const getChannelMembersMock = relayHttp.getChannelMembers as unknown as ReturnType<typeof vi.fn>;

const SAMPLE_MEMBERS: ChannelMember[] = [
  { pubkey: "pub1", role: "owner", joinedAt: "2026-01-01T00:00:00Z", displayName: "Alice" },
  { pubkey: "pub2", role: "member", joinedAt: "2026-01-02T00:00:00Z", displayName: null },
];

describe("useChannelMembers", () => {
  beforeEach(() => {
    getChannelMembersMock.mockReset();
  });

  it("returns the loaded members on success", async () => {
    getChannelMembersMock.mockResolvedValueOnce(SAMPLE_MEMBERS);
    const { result } = renderHook(() => useChannelMembers("chan-1"));
    expect(result.current.loading).toBe(true);
    expect(result.current.members).toEqual([]);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.members).toEqual(SAMPLE_MEMBERS);
    expect(result.current.error).toBeNull();
    expect(getChannelMembersMock).toHaveBeenCalledWith("chan-1");
  });

  it("surfaces fetch errors and keeps members empty", async () => {
    getChannelMembersMock.mockRejectedValueOnce(new Error("500 boom"));
    const { result } = renderHook(() => useChannelMembers("chan-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("500 boom");
    expect(result.current.members).toEqual([]);
  });

  it("refetch clears stale error and refreshes", async () => {
    getChannelMembersMock.mockRejectedValueOnce(new Error("first"));
    getChannelMembersMock.mockResolvedValueOnce(SAMPLE_MEMBERS);
    const { result } = renderHook(() => useChannelMembers("chan-1"));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.members).toEqual(SAMPLE_MEMBERS);
    });
    expect(result.current.error).toBeNull();
  });

  it("reloads when channelId changes", async () => {
    const other: ChannelMember[] = [
      { pubkey: "pub3", role: "admin", joinedAt: "2026-01-03T00:00:00Z", displayName: "Bob" },
    ];
    getChannelMembersMock.mockResolvedValueOnce(SAMPLE_MEMBERS);
    getChannelMembersMock.mockResolvedValueOnce(other);
    const { result, rerender } = renderHook(({ id }: { id: string }) => useChannelMembers(id), {
      initialProps: { id: "chan-1" },
    });
    await waitFor(() => expect(result.current.members).toEqual(SAMPLE_MEMBERS));
    rerender({ id: "chan-2" });
    await waitFor(() => expect(result.current.members).toEqual(other));
    expect(getChannelMembersMock).toHaveBeenCalledTimes(2);
    expect(getChannelMembersMock).toHaveBeenNthCalledWith(1, "chan-1");
    expect(getChannelMembersMock).toHaveBeenNthCalledWith(2, "chan-2");
  });

  it("ignores stale responses when channelId changes before the first resolves", async () => {
    const other: ChannelMember[] = [
      { pubkey: "pub3", role: "admin", joinedAt: "2026-01-03T00:00:00Z", displayName: "Bob" },
    ];
    let resolveFirst: (v: ChannelMember[]) => void = () => {};
    const firstPromise = new Promise<ChannelMember[]>((r) => {
      resolveFirst = r;
    });
    getChannelMembersMock.mockReturnValueOnce(firstPromise);
    getChannelMembersMock.mockResolvedValueOnce(other);

    const { result, rerender } = renderHook(({ id }: { id: string }) => useChannelMembers(id), {
      initialProps: { id: "chan-1" },
    });
    rerender({ id: "chan-2" });
    await waitFor(() => expect(result.current.members).toEqual(other));
    // Now resolve the stale first request; its result must be ignored.
    resolveFirst(SAMPLE_MEMBERS);
    await Promise.resolve();
    expect(result.current.members).toEqual(other);
  });
});
