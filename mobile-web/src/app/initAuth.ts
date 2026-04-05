import { onUnauthorized, setAuthTokenProvider, setBaseUrl } from "../api/authFetch";

type RuntimeConfig = {
  relayBaseUrl?: string;
};

function readEnvBaseUrl(): string | null {
  const v = (import.meta as any).env?.VITE_RELAY_BASE_URL as string | undefined;
  return v && v.length > 0 ? v : null;
}

async function readRuntimeConfig(): Promise<RuntimeConfig | null> {
  try {
    const res = await fetch("/config.json", { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as RuntimeConfig;
  } catch {
    return null;
  }
}

function installTokenProvider() {
  // Simple demo provider:
  // - Prefer long-lived sprout_* token in localStorage
  // - Fall back to a JWT in sessionStorage
  setAuthTokenProvider(() => {
    const sprout = window.localStorage.getItem("sprout_token");
    if (sprout) return sprout;
    const jwt = window.sessionStorage.getItem("access_token");
    return jwt ?? null;
  });

  // Dev helpers for setting tokens from console/tests.
  // window.sproutAuth.setSproutToken("sprout_...")
  // window.sproutAuth.setAccessToken("eyJ...")
  (window as any).sproutAuth = {
    setSproutToken(token: string) {
      window.localStorage.setItem("sprout_token", token);
    },
    setAccessToken(token: string) {
      window.sessionStorage.setItem("access_token", token);
    },
    clear() {
      window.localStorage.removeItem("sprout_token");
      window.sessionStorage.removeItem("access_token");
    },
  };
}

function installUnauthorizedHandler() {
  onUnauthorized(() => {
    // Minimal default: log and stay put. Apps can override as needed.
    // Hook point for OIDC silent refresh or redirect to login page.
    // eslint-disable-next-line no-console
    console.warn("401 from relay; consider triggering re-login or refresh.");
  });
}

export async function initAuth() {
  installTokenProvider();
  installUnauthorizedHandler();

  const runtime = await readRuntimeConfig();
  const base = runtime?.relayBaseUrl ?? readEnvBaseUrl();
  if (base) setBaseUrl(base);
}

