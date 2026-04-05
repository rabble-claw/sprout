// ABOUTME: Mobile profile screen — shows user identity and active API tokens.
// ABOUTME: Uses pure REST endpoints (getProfile, listTokens) so it works with sprout_* tokens.
import type { Profile, Token } from "@sprout-shared/api/types";
import { useProfile } from "./useProfile";
import { useTokens } from "./useTokens";

export function ProfilePage() {
  const { profile, loading: profileLoading, error: profileError, refetch: refetchProfile } = useProfile();
  const { tokens, loading: tokensLoading, error: tokensError, refetch: refetchTokens } = useTokens();

  return (
    <div className="space-y-5">
      <ProfileCard
        profile={profile}
        loading={profileLoading}
        error={profileError}
        onRetry={refetchProfile}
      />
      <section aria-labelledby="profile-tokens-heading">
        <h2
          id="profile-tokens-heading"
          className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
        >
          API tokens
        </h2>
        <TokensSection
          tokens={tokens}
          loading={tokensLoading}
          error={tokensError}
          onRetry={refetchTokens}
        />
      </section>
    </div>
  );
}

function ProfileCard({
  profile,
  loading,
  error,
  onRetry,
}: {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (loading && !profile) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-4" aria-busy="true">
        <div className="h-12 w-12 animate-pulse rounded-full bg-muted" />
        <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  if (error && !profile) {
    return (
      <ErrorCard title="Couldn't load profile" message={error.message} onRetry={onRetry} />
    );
  }

  if (!profile) return null;

  const display = profile.displayName?.trim() || profile.pubkey.slice(0, 12);
  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
          {profile.avatarUrl ? (
            // eslint-disable-next-line jsx-a11y/alt-text
            <img src={profile.avatarUrl} className="h-full w-full object-cover" alt="" />
          ) : (
            display.slice(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{display}</p>
          {profile.nip05Handle ? (
            <p className="truncate text-xs text-muted-foreground">{profile.nip05Handle}</p>
          ) : null}
          <p className="mt-0.5 truncate font-mono text-[10px] text-muted-foreground">
            {profile.pubkey}
          </p>
        </div>
      </div>
      {profile.about ? (
        <p className="mt-3 text-xs leading-snug text-muted-foreground">{profile.about}</p>
      ) : null}
    </div>
  );
}

function TokensSection({
  tokens,
  loading,
  error,
  onRetry,
}: {
  tokens: Token[];
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
}) {
  if (loading && tokens.length === 0) {
    return (
      <ul className="space-y-2" aria-busy="true">
        {Array.from({ length: 2 }).map((_, i) => (
          <li
            key={i}
            className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3"
          >
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="mt-2 h-2 w-2/3 animate-pulse rounded bg-muted" />
          </li>
        ))}
      </ul>
    );
  }

  if (error && tokens.length === 0) {
    return <ErrorCard title="Couldn't load tokens" message={error.message} onRetry={onRetry} />;
  }

  if (tokens.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center">
        <p className="text-xs text-muted-foreground">
          No active tokens. Sign in with a Nostr extension to mint one.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
      {tokens.map((token) => (
        <li key={token.id} className="px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold">{token.name}</p>
            {token.expiresAt ? (
              <span className="shrink-0 text-[10px] text-muted-foreground">
                expires {new Date(token.expiresAt).toLocaleDateString()}
              </span>
            ) : (
              <span className="shrink-0 text-[10px] text-muted-foreground">no expiry</span>
            )}
          </div>
          <p className="mt-1 flex flex-wrap gap-1">
            {token.scopes.map((scope) => (
              <span
                key={scope}
                className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
              >
                {scope}
              </span>
            ))}
          </p>
          {token.lastUsedAt ? (
            <p className="mt-1 text-[10px] text-muted-foreground">
              last used {new Date(token.lastUsedAt).toLocaleDateString()}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ErrorCard({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 rounded-full border border-border/60 px-3 py-1 text-xs font-medium hover:bg-accent/40"
      >
        Try again
      </button>
    </div>
  );
}
