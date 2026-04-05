// ABOUTME: Unit tests for sortTokens helper and useTokens hook.
// ABOUTME: Mocks relayHttp.listTokens to cover success / error / refetch paths.
import { describe, expect, it, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import type { Token, TokenScope } from "@sprout-shared/api/types";
import { sortTokens, useTokens } from "./useTokens";

vi.mock("../../api/relayHttp", () => ({
  listTokens: vi.fn(),
}));

import * as relayHttp from "../../api/relayHttp";
const listTokensMock = relayHttp.listTokens as unknown as ReturnType<typeof vi.fn>;

const SCOPES: TokenScope[] = ["messages:read"];

function makeToken(partial: Partial<Token> & { id: string; createdAt: string }): Token {
  return {
    id: partial.id,
    name: partial.name ?? `token-${partial.id}`,
    scopes: partial.scopes ?? SCOPES,
    channelIds: partial.channelIds ?? [],
    createdAt: partial.createdAt,
    expiresAt: partial.expiresAt ?? null,
    lastUsedAt: partial.lastUsedAt ?? null,
    revokedAt: partial.revokedAt ?? null,
  };
}

describe("sortTokens", () => {
  it("orders tokens newest-created first", () => {
    const tokens = [
      makeToken({ id: "a", createdAt: "2025-01-01T00:00:00Z" }),
      makeToken({ id: "b", createdAt: "2026-01-01T00:00:00Z" }),
      makeToken({ id: "c", createdAt: "2025-06-01T00:00:00Z" }),
    ];
    expect(sortTokens(tokens).map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("drops revoked tokens", () => {
    const tokens = [
      makeToken({ id: "a", createdAt: "2025-01-01T00:00:00Z" }),
      makeToken({
        id: "b",
        createdAt: "2026-01-01T00:00:00Z",
        revokedAt: "2026-02-01T00:00:00Z",
      }),
    ];
    expect(sortTokens(tokens).map((t) => t.id)).toEqual(["a"]);
  });

  it("handles invalid createdAt strings as timestamp 0", () => {
    const tokens = [
      makeToken({ id: "valid", createdAt: "2025-01-01T00:00:00Z" }),
      makeToken({ id: "invalid", createdAt: "not a date" }),
    ];
    expect(sortTokens(tokens).map((t) => t.id)).toEqual(["valid", "invalid"]);
  });
});

describe("useTokens", () => {
  beforeEach(() => {
    listTokensMock.mockReset();
  });

  it("loads tokens and sorts them", async () => {
    listTokensMock.mockResolvedValueOnce([
      makeToken({ id: "a", createdAt: "2025-01-01T00:00:00Z" }),
      makeToken({ id: "b", createdAt: "2026-01-01T00:00:00Z" }),
    ]);
    const { result } = renderHook(() => useTokens());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.tokens.map((t) => t.id)).toEqual(["b", "a"]);
  });

  it("surfaces fetch errors", async () => {
    listTokensMock.mockRejectedValueOnce(new Error("bad auth"));
    const { result } = renderHook(() => useTokens());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error?.message).toBe("bad auth");
    expect(result.current.tokens).toEqual([]);
  });

  it("refetch clears the previous error", async () => {
    listTokensMock.mockRejectedValueOnce(new Error("first"));
    listTokensMock.mockResolvedValueOnce([makeToken({ id: "a", createdAt: "2025-01-01T00:00:00Z" })]);
    const { result } = renderHook(() => useTokens());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    await result.current.refetch();
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
    expect(result.current.tokens.map((t) => t.id)).toEqual(["a"]);
  });
});
