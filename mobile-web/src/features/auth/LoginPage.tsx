import { Button } from "@sprout-shared/ui/button";
import { mintTokenViaNip07 } from "../../api/authNip07";

const DEFAULT_SCOPES = [
  "messages:read",
  "messages:write",
  "channels:read",
  "users:read",
] as const;

export function LoginPage() {
  async function signInNip07() {
    try {
      const { token } = await mintTokenViaNip07({
        name: "Sprout Mobile Web",
        scopes: [...DEFAULT_SCOPES],
      });
      // Persist token for future sessions
      (window as any).sproutAuth?.setSproutToken?.(token);
      // Redirect to home
      window.location.href = "/";
    } catch (e) {
      // eslint-disable-next-line no-alert
      alert((e as Error).message || "Failed to sign in with Nostr");
    }
  }

  return (
    <div className="mx-auto max-w-sm py-12 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">Choose a sign-in method</p>
      </div>
      <div className="space-y-3">
        <Button className="w-full" onClick={signInNip07}>
          Sign in with Nostr extension
        </Button>
      </div>
    </div>
  );
}

