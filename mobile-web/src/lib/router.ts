// ABOUTME: Minimal SPA router built on history.pushState + popstate.
// ABOUTME: Exposes useRoute() / navigate(path) with no external dependencies.
import { useEffect, useState } from "react";

export type Route = {
  pathname: string;
  search: string;
  hash: string;
};

function readRoute(): Route {
  if (typeof window === "undefined") {
    return { pathname: "/", search: "", hash: "" };
  }
  const { pathname, search, hash } = window.location;
  return { pathname, search, hash };
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    try {
      listener();
    } catch (error) {
      console.error("router listener error", error);
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("popstate", emit);
}

export function navigate(path: string, options: { replace?: boolean } = {}) {
  if (typeof window === "undefined") return;
  const current = window.location.pathname + window.location.search + window.location.hash;
  if (path === current && !options.replace) return;
  if (options.replace) window.history.replaceState({}, "", path);
  else window.history.pushState({}, "", path);
  emit();
}

export function subscribeRoute(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute);
  useEffect(() => subscribeRoute(() => setRoute(readRoute())), []);
  return route;
}

export function matchPath(pattern: string, pathname: string): Record<string, string> | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = pathname.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    const p = patternParts[i];
    const v = pathParts[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(v);
    } else if (p !== v) {
      return null;
    }
  }
  return params;
}
