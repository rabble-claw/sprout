// ABOUTME: Unit tests for the tiny SPA router helpers.
// ABOUTME: Requires vitest + happy-dom/jsdom; excluded from tsc until installed.
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { matchPath, navigate, subscribeRoute } from "./router";

describe("matchPath", () => {
  it("returns an empty params object for exact matches", () => {
    expect(matchPath("/channels", "/channels")).toEqual({});
  });

  it("extracts a single named parameter", () => {
    expect(matchPath("/channels/:id", "/channels/abc123")).toEqual({ id: "abc123" });
  });

  it("extracts multiple named parameters", () => {
    expect(matchPath("/channels/:channelId/messages/:eventId", "/channels/c1/messages/e2"))
      .toEqual({ channelId: "c1", eventId: "e2" });
  });

  it("returns null when segment counts differ", () => {
    expect(matchPath("/channels/:id", "/channels")).toBeNull();
    expect(matchPath("/channels/:id", "/channels/a/b")).toBeNull();
  });

  it("returns null when a literal segment differs", () => {
    expect(matchPath("/channels/:id", "/feed/abc")).toBeNull();
  });

  it("decodes URI-encoded parameter values", () => {
    expect(matchPath("/channels/:id", "/channels/a%20b")).toEqual({ id: "a b" });
  });
});

describe("navigate", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/");
  });
  afterEach(() => {
    window.history.replaceState({}, "", "/");
  });

  it("pushes a new history entry and notifies subscribers", () => {
    let notifyCount = 0;
    const unsubscribe = subscribeRoute(() => {
      notifyCount += 1;
    });
    navigate("/channels");
    expect(window.location.pathname).toBe("/channels");
    expect(notifyCount).toBe(1);
    unsubscribe();
  });

  it("is a no-op for the current path unless replace is set", () => {
    window.history.replaceState({}, "", "/feed");
    let notifyCount = 0;
    const unsubscribe = subscribeRoute(() => {
      notifyCount += 1;
    });
    navigate("/feed");
    expect(notifyCount).toBe(0);
    navigate("/feed", { replace: true });
    expect(notifyCount).toBe(1);
    unsubscribe();
  });
});
