// ABOUTME: Mobile-first home feed screen — mentions, needs-action, activity, agents.
// ABOUTME: Pulls from the REST /api/feed endpoint via useHomeFeed (no signer required).
import type { FeedItem, HomeFeed } from "@sprout-shared/api/types";
import { navigate } from "../../lib/router";
import { useHomeFeed } from "./useHomeFeed";

const SECTIONS: Array<{ key: keyof HomeFeed; title: string }> = [
  { key: "mentions", title: "Mentions" },
  { key: "needsAction", title: "Needs action" },
  { key: "activity", title: "Activity" },
  { key: "agentActivity", title: "Agent activity" },
];

export function HomeFeedPage() {
  const { feed, loading, error, refetch } = useHomeFeed();

  const totalItems =
    feed.mentions.length + feed.needsAction.length + feed.activity.length + feed.agentActivity.length;

  if (loading && totalItems === 0) {
    return <FeedSkeleton />;
  }

  if (error && totalItems === 0) {
    return (
      <div
        className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
        role="alert"
      >
        <p className="text-sm font-medium text-destructive">Couldn't load feed</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <button
          type="button"
          onClick={refetch}
          className="mt-3 rounded-full border border-border/60 px-3 py-1 text-xs font-medium hover:bg-accent/40"
        >
          Try again
        </button>
      </div>
    );
  }

  if (totalItems === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
        <p className="text-sm font-medium">Your feed is quiet</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Mentions and activity across your channels will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {SECTIONS.map(({ key, title }) => {
        const items = feed[key];
        if (items.length === 0) return null;
        return (
          <section key={key} aria-labelledby={`feed-section-${key}`}>
            <h2
              id={`feed-section-${key}`}
              className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              {title}
            </h2>
            <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
              {items.map((item) => (
                <li key={`${item.category}-${item.id}`}>
                  <FeedItemRow item={item} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function FeedItemRow({ item }: { item: FeedItem }) {
  const onOpen = () => {
    if (item.channelId) navigate(`/channels/${encodeURIComponent(item.channelId)}`);
  };
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-accent/40 active:bg-accent/60"
      data-testid={`feed-item-${item.id}`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          {item.channelName ? (
            <span className="truncate font-medium text-foreground">#{item.channelName}</span>
          ) : null}
          <span className="shrink-0">{formatRelativeTime(item.createdAt)}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm leading-snug">{item.content || "(empty)"}</p>
      </div>
    </button>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading feed">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-border/60 bg-card/60 px-4 py-3"
        >
          <div className="h-2 w-1/4 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-4/5 animate-pulse rounded bg-muted" />
          <div className="mt-1 h-3 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
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
