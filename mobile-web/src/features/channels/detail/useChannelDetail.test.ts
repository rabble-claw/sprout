// ABOUTME: Unit tests for useChannelDetail — loading / success / error / refetch.
// ABOUTME: Mocks relayHttp.getChannelDetails so no network is touched.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { ChannelDetail } from "@sprout-shared/api/types";
import { useChannelDetail } from "./useChannelDetail";

vi.mock("../../../api/relayHttp", () => ({
  getChannelDetails: vi.fn(),
}));

import * as relayHttp from "../../../api/relayHttp";
const getChannelDetailsMock = relayHttp.getChannelDetails as unknown as ReturnType<typeof vi.fn>;

const SAMPLE_DETAIL: ChannelDetail = {
  id: "chan-1",
  name: "general",
  channelType: "stream",
  visibility: "open",
  description: "general chit chat",
  topic: "hello world",
  purpose: null,
  memberCount: 3,
  lastMessageAt: null,
  archivedAt: null,
  participants: [],
  participantPubkeys: [],
  isMember: true,
  createdBy: "pub1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  topicSetBy: "pub1",
  topicSetAt: "2026-01-01T00:00:00Z",
  purposeSetBy: null,
  purposeSetAt: null,
  topicRequired: false,
  maxMembers: null,
  nip29GroupId: null,
};

describe("useChannelDetail", () => {
  beforeEach(() => {
    getChannelDetailsMock.mockReset();
  });

  it("returns the loaded detail on success", async () => {
    getChannelDetailsMock.mockResolvedValueOnce(SAMPLE_DETAIL);
    const { result } = renderHook(() => useChannelDetail("chan-1"));
    expect(result.current.loading).toBe(true);
    expect(result.current.detail).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.detail).toEqual(SAMPLE_DETAIL);
    expect(result.current.error).toBeNull();
    expect(getChannelDetailsMock).toHaveBeenCalledWith("chan-1");
  });

  it("surfaces fetch errors and keeps detail null", async () => {
    getChannelDetailsMock.mockRejectedValueOnce(new Error("404 not found"));
    const { result } = renderHook(() => useChannelDetail("chan-1"));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("404 not found");
    expect(result.current.detail).toBeNull();
  });

  it("refetch clears stale error and refreshes", async () => {
    getChannelDetailsMock.mockRejectedValueOnce(new Error("first"));
    getChannelDetailsMock.mockResolvedValueOnce(SAMPLE_DETAIL);
    const { result } = renderHook(() => useChannelDetail("chan-1"));
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).not.toBeNull();
    });
    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.detail).toEqual(SAMPLE_DETAIL);
    });
    expect(result.current.error).toBeNull();
  });

  it("reloads when channelId changes", async () => {
    const other: ChannelDetail = { ...SAMPLE_DETAIL, id: "chan-2", name: "random" };
    getChannelDetailsMock.mockResolvedValueOnce(SAMPLE_DETAIL);
    getChannelDetailsMock.mockResolvedValueOnce(other);
    const { result, rerender } = renderHook(({ id }: { id: string }) => useChannelDetail(id), {
      initialProps: { id: "chan-1" },
    });
    await waitFor(() => expect(result.current.detail?.id).toBe("chan-1"));
    rerender({ id: "chan-2" });
    await waitFor(() => expect(result.current.detail?.id).toBe("chan-2"));
    expect(getChannelDetailsMock).toHaveBeenCalledTimes(2);
    expect(getChannelDetailsMock).toHaveBeenNthCalledWith(1, "chan-1");
    expect(getChannelDetailsMock).toHaveBeenNthCalledWith(2, "chan-2");
  });

  it("ignores stale responses when channelId changes before the first resolves", async () => {
    const other: ChannelDetail = { ...SAMPLE_DETAIL, id: "chan-2", name: "random" };
    let resolveFirst: (v: ChannelDetail) => void = () => {};
    const firstPromise = new Promise<ChannelDetail>((r) => {
      resolveFirst = r;
    });
    getChannelDetailsMock.mockReturnValueOnce(firstPromise);
    getChannelDetailsMock.mockResolvedValueOnce(other);

    const { result, rerender } = renderHook(({ id }: { id: string }) => useChannelDetail(id), {
      initialProps: { id: "chan-1" },
    });
    rerender({ id: "chan-2" });
    await waitFor(() => expect(result.current.detail?.id).toBe("chan-2"));
    // Now resolve the stale first request; its result must be ignored.
    resolveFirst(SAMPLE_DETAIL);
    await Promise.resolve();
    expect(result.current.detail?.id).toBe("chan-2");
  });
});
