import { getAuthToken } from "../api/authFetch";

export function hasNip07(): boolean {
  return typeof window !== "undefined" && !!window.nostr?.signEvent;
}

export async function canUseWebSocket(): Promise<boolean> {
  if (!hasNip07()) return false;
  // Token improves chances on production relays; not strictly required in dev.
  // We don't hard-fail when absent.
  void getAuthToken();
  return true;
}
