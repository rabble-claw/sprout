// ABOUTME: Unit tests for the useSearch hook — debounced query, success, error, staleness.
// ABOUTME: Mocks relayHttp.searchMessages and uses fake timers to control debounce.
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import type { SearchHit, SearchMessagesResponse } from "@sprout-shared/api/types";
import { useSearch } from "./useSearch";

/**
 * Flush pending microtasks so resolved mocked promises propagate state updates.
 * `waitFor` doesn't work well under fake timers, so we flush explicitly inside act().
 */
async function flush() {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

vi.mock("../../api/relayHttp", () => ({
  searchMessages: vi.fn(),
}));

import * as relayHttp from "../../api/relayHttp";
const searchMessagesMock = relayHttp.searchMessages as unknown as ReturnType<typeof vi.fn>;

function makeHit(id: string, content = "hello world"): SearchHit {
  return {
    eventId: id,
    content,
    kind: 9,
    pubkey: "pk_" + id,
    channelId: "chan_" + id,
    channelName: "general",
    createdAt: 1_700_000_000,
    score: 0.9,
  };
}

function makeResponse(hits: SearchHit[]): SearchMessagesResponse {
  return { hits, found: hits.length };
}

describe("useSearch", () => {
  beforeEach(() => {
    searchMessagesMock.mockReset();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts with empty state and makes no request", () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.query).toBe("");
    expect(result.current.hits).toEqual([]);
    expect(result.current.found).toBe(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(searchMessagesMock).not.toHaveBeenCalled();
  });

  it("debounces the request 300ms after setQuery and populates hits", async () => {
    searchMessagesMock.mockResolvedValueOnce(makeResponse([makeHit("a"), makeHit("b")]));
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("hello");
    });
    expect(searchMessagesMock).not.toHaveBeenCalled();

    // Just before the debounce window — still no call.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(299);
    });
    expect(searchMessagesMock).not.toHaveBeenCalled();

    // Tip over the 300ms threshold — call fires.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(searchMessagesMock).toHaveBeenCalledTimes(1);
    expect(searchMessagesMock).toHaveBeenCalledWith({ q: "hello" });

    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.hits).toHaveLength(2);
    expect(result.current.found).toBe(2);
    expect(result.current.error).toBeNull();
  });

  it("clearing the query resets hits without a network call", async () => {
    searchMessagesMock.mockResolvedValueOnce(makeResponse([makeHit("a")]));
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("hello");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    await flush();
    expect(result.current.hits).toHaveLength(1);

    searchMessagesMock.mockClear();

    act(() => {
      result.current.setQuery("");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });

    expect(searchMessagesMock).not.toHaveBeenCalled();
    expect(result.current.hits).toEqual([]);
    expect(result.current.found).toBe(0);
    expect(result.current.loading).toBe(false);
  });

  it("only fires the last request on rapid successive setQuery calls", async () => {
    searchMessagesMock.mockResolvedValue(makeResponse([makeHit("c")]));
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("h");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    act(() => {
      result.current.setQuery("he");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    act(() => {
      result.current.setQuery("hel");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    expect(searchMessagesMock).toHaveBeenCalledTimes(1);
    expect(searchMessagesMock).toHaveBeenCalledWith({ q: "hel" });
  });

  it("surfaces API errors and keeps hits empty", async () => {
    searchMessagesMock.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("oops");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });

    await flush();
    expect(result.current.loading).toBe(false);
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.hits).toEqual([]);
    expect(result.current.found).toBe(0);
  });

  it("ignores stale responses when a newer request has been issued", async () => {
    let resolveFirst!: (v: SearchMessagesResponse) => void;
    const firstPromise = new Promise<SearchMessagesResponse>((res) => {
      resolveFirst = res;
    });
    searchMessagesMock.mockImplementationOnce(() => firstPromise);
    searchMessagesMock.mockResolvedValueOnce(makeResponse([makeHit("newer")]));

    const { result } = renderHook(() => useSearch());

    act(() => {
      result.current.setQuery("first");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchMessagesMock).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.setQuery("second");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(300);
    });
    expect(searchMessagesMock).toHaveBeenCalledTimes(2);

    // Resolve the second (most recent) request — done via mockResolvedValueOnce above.
    await flush();
    expect(result.current.hits).toHaveLength(1);
    expect(result.current.hits[0].eventId).toBe("newer");

    // Now resolve the stale first request; its result must be ignored.
    await act(async () => {
      resolveFirst(makeResponse([makeHit("stale")]));
    });
    await flush();

    expect(result.current.hits).toHaveLength(1);
    expect(result.current.hits[0].eventId).toBe("newer");
  });
});
