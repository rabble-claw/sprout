// ABOUTME: Unit tests for BottomNav.isActive tab-matching logic.
// ABOUTME: Requires vitest; excluded from tsc until installed.
import { describe, expect, it } from "vitest";
import { isActive, _testing } from "./BottomNav";

const { TABS } = _testing;
const channelsTab = TABS.find((t) => t.id === "channels")!;
const feedTab = TABS.find((t) => t.id === "feed")!;
const searchTab = TABS.find((t) => t.id === "search")!;
const profileTab = TABS.find((t) => t.id === "profile")!;

describe("isActive", () => {
  it("channels tab matches root path", () => {
    expect(isActive(channelsTab, "/")).toBe(true);
  });

  it("channels tab matches /channels and nested channel routes", () => {
    expect(isActive(channelsTab, "/channels")).toBe(true);
    expect(isActive(channelsTab, "/channels/abc123")).toBe(true);
    expect(isActive(channelsTab, "/channels/abc123/messages")).toBe(true);
  });

  it("channels tab does not match other sections", () => {
    expect(isActive(channelsTab, "/feed")).toBe(false);
    expect(isActive(channelsTab, "/profile")).toBe(false);
    expect(isActive(channelsTab, "/settings")).toBe(false);
  });

  it("feed tab matches /feed only", () => {
    expect(isActive(feedTab, "/feed")).toBe(true);
    expect(isActive(feedTab, "/feed/something")).toBe(true);
    expect(isActive(feedTab, "/")).toBe(false);
    expect(isActive(feedTab, "/channels")).toBe(false);
  });

  it("profile tab matches /profile only", () => {
    expect(isActive(profileTab, "/profile")).toBe(true);
    expect(isActive(profileTab, "/profile/tokens")).toBe(true);
    expect(isActive(profileTab, "/feed")).toBe(false);
  });

  it("search tab matches /search only", () => {
    expect(isActive(searchTab, "/search")).toBe(true);
    expect(isActive(searchTab, "/search?q=foo")).toBe(true);
    expect(isActive(searchTab, "/")).toBe(false);
    expect(isActive(searchTab, "/channels")).toBe(false);
  });
});
