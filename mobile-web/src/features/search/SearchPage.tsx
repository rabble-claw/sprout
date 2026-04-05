// ABOUTME: Mobile search screen — debounced full-text search across channels via the relay.
// ABOUTME: Pure REST (no signer); tapping a hit navigates to the hit's channel.
import { useEffect, useRef } from "react";
import type { SearchHit } from "@sprout-shared/api/types";
import { navigate } from "../../lib/router";
import { useSearch } from "./useSearch";

export function SearchPage() {
  const { query, setQuery, hits, found, loading, error } = useSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const trimmed = query.trim();

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="sr-only">Search messages</span>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="search"
            inputMode="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder="Search messages"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-12 w-full rounded-2xl border border-border/60 bg-card/60 pl-11 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-border focus:bg-card"
          />
        </div>
      </label>

      <SearchBody
        query={trimmed}
        hits={hits}
        found={found}
        loading={loading}
        error={error}
        onRetry={() => {
          // React bails on setState with identical value, so toggle a trailing
          // space to force the debounced effect to re-run. The hook trims
          // before calling the API, so the request URL is unchanged.
          setQuery(query.endsWith(" ") ? query.trimEnd() : `${query} `);
        }}
      />
    </div>
  );
}

type SearchBodyProps = {
  query: string;
  hits: SearchHit[];
  found: number;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
};

function SearchBody({ query, hits, found, loading, error, onRetry }: SearchBodyProps) {
  if (query === "") {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
        <p className="text-sm font-medium">Search messages across your channels</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Find mentions, links, or anything you remember seeing.
        </p>
      </div>
    );
  }

  if (loading && hits.length === 0) {
    return <ResultsSkeleton />;
  }

  if (error) {
    return (
      <div
        className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
        role="alert"
      >
        <p className="text-sm font-medium text-destructive">Search failed</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-full border border-border/60 px-3 py-1 text-xs font-medium hover:bg-accent/40"
        >
          Retry
        </button>
      </div>
    );
  }

  if (hits.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
        <p className="text-sm font-medium">No matches for "{query}"</p>
        <p className="mt-1 text-xs text-muted-foreground">Try different words or a shorter query.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {found} {found === 1 ? "result" : "results"}
      </p>
      <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
        {hits.map((hit) => (
          <li key={hit.eventId}>
            <SearchHitRow hit={hit} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function SearchHitRow({ hit }: { hit: SearchHit }) {
  const onOpen = () => {
    if (hit.channelId) navigate(`/channels/${encodeURIComponent(hit.channelId)}`);
  };
  const shortPubkey = hit.pubkey ? `${hit.pubkey.slice(0, 8)}…` : "";
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-accent/40 active:bg-accent/60"
      data-testid={`search-hit-${hit.eventId}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {hit.channelName ? (
            <span className="truncate font-medium text-foreground">#{hit.channelName}</span>
          ) : null}
          {shortPubkey ? <span className="truncate">{shortPubkey}</span> : null}
          <span className="shrink-0">{formatRelativeTime(hit.createdAt)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-snug">{hit.content || "(empty)"}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">
          score {hit.score.toFixed(2)}
        </p>
      </div>
    </button>
  );
}

function ResultsSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Searching">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3">
          <div className="h-2 w-1/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

function formatRelativeTime(createdAtSec: number): string {
  if (!createdAtSec) return "";
  const diffSec = Math.max(0, Math.floor(Date.now() / 1000 - createdAtSec));
  if (diffSec < 60) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return new Date(createdAtSec * 1000).toLocaleDateString();
}
