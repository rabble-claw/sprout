import { Button } from "@sprout-shared/ui/button";
import { useEffect, useState } from "react";
import { hasNip07 } from "../lib/capabilities";
import { DevRelayPane } from "./DevRelayPane";
import { LoginPage } from "../features/auth/LoginPage";
// external signer integration removed

export function AppShell() {
  const [nip07, setNip07] = useState(() => hasNip07());
  const [showDev, setShowDev] = useState(false);

  useEffect(() => {
    const t = window.setInterval(() => setNip07(hasNip07()), 1500);
    return () => window.clearInterval(t);
  }, []);

  const showLogin = typeof window !== "undefined" && window.location.pathname === "/auth/login";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="mx-auto max-w-screen-md px-4 h-12 flex items-center justify-between">
          <div className="text-sm font-medium">Sprout Mobile Web</div>
          <div className="flex items-center gap-2">
            {(import.meta as any).env?.DEV && (
              <Button size="sm" variant="secondary" onClick={() => setShowDev((v) => !v)}>
                {showDev ? "Hide Dev" : "Dev: WS Test"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const token = window.prompt("Paste JWT (eyJ...) or sprout_* token");
                if (!token) return;
                if (token.startsWith("sprout_")) (window as any).sproutAuth?.setSproutToken(token);
                else (window as any).sproutAuth?.setAccessToken(token);
              }}
            >
              Set Token
            </Button>
          </div>
        </div>
        {!nip07 && (
          <div className="bg-yellow-100 text-yellow-900 text-xs px-4 py-2 border-t">
            Nostr extension not detected. Live updates via WebSocket are disabled.
          </div>
        )}

      </header>
      <main className="flex-1 mx-auto max-w-screen-md px-4 py-6 space-y-4">
        {showLogin ? (
          <LoginPage />
        ) : (
          <>
            <p className="text-muted-foreground text-sm">Blank shell. Shared UI import working.</p>
            {(import.meta as any).env?.DEV && showDev && <DevRelayPane />}
          </>
        )}
      </main>
    </div>
  );
}
