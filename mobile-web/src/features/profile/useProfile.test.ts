// ABOUTME: Unit tests for the useProfile hook — loading / success / error / refetch.
// ABOUTME: Mocks relayHttp.getProfile so no network is touched.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Profile } from "@sprout-shared/api/types";
import { useProfile } from "./useProfile";

vi.mock("../../api/relayHttp", () => ({
  getProfile: vi.fn(),
}));

import * as relayHttp from "../../api/relayHttp";
const getProfileMock = relayHttp.getProfile as unknown as ReturnType<typeof vi.fn>;

const SAMPLE_PROFILE: Profile = {
  pubkey: "abc123",
  displayName: "Rabble",
  avatarUrl: null,
  about: "hello",
  nip05Handle: "rabble@sprout",
};

describe("useProfile", () => {
  beforeEach(() => {
    getProfileMock.mockReset();
  });

  it("returns the loaded profile on success", async () => {
    getProfileMock.mockResolvedValueOnce(SAMPLE_PROFILE);
    const { result } = renderHook(() => useProfile());
    expect(result.current.loading).toBe(true);
    expect(result.current.profile).toBeNull();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile).toEqual(SAMPLE_PROFILE);
    expect(result.current.error).toBeNull();
  });

  it("surfaces fetch errors and keeps profile null", async () => {
    getProfileMock.mockRejectedValueOnce(new Error("401 unauthorized"));
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("401 unauthorized");
    expect(result.current.profile).toBeNull();
  });

  it("refetch clears stale error and refreshes", async () => {
    getProfileMock.mockRejectedValueOnce(new Error("first"));
    getProfileMock.mockResolvedValueOnce(SAMPLE_PROFILE);
    const { result } = renderHook(() => useProfile());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    expect(result.current.profile).toEqual(SAMPLE_PROFILE);
  });
});
