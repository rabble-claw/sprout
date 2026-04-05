// ABOUTME: Mobile-first channels list screen — the default post-login view.
// ABOUTME: Renders loading skeleton, empty state, error state, and a tap-friendly list.
import type { Channel } from "@sprout-shared/api/types";
import { navigate } from "../../lib/router";
import { useChannels } from "./useChannels";

export function ChannelsListPage() {
  const { channels, loading, error, refetch } = useChannels();

  if (loading && channels.length === 0) {
    return <ChannelsListSkeleton />;
  }

  if (error && channels.length === 0) {
    return <ChannelsListError error={error} onRetry={refetch} />;
  }

  if (channels.length === 0) {
    return <ChannelsListEmpty />;
  }

  return (
    <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
      {channels.map((channel) => (
        <li key={channel.id}>
          <ChannelRow
            channel={channel}
            onOpen={() => navigate(`/channels/${encodeURIComponent(channel.id)}`)}
          />
        </li>
      ))}
    </ul>
  );
}

function ChannelRow({ channel, onOpen }: { channel: Channel; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors first:rounded-t-2xl last:rounded-b-2xl hover:bg-accent/40 active:bg-accent/60"
      data-testid={`channel-row-${channel.id}`}
    >
      <ChannelAvatar channel={channel} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{channel.name}</p>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {channel.channelType}
          </span>
        </div>
        {channel.topic || channel.description ? (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
            {channel.topic || channel.description}
          </p>
        ) : null}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] text-muted-foreground">
          {formatRelativeTime(channel.lastMessageAt)}
        </p>
        <p className="text-[10px] text-muted-foreground">{channel.memberCount} members</p>
      </div>
    </button>
  );
}

function ChannelAvatar({ channel }: { channel: Channel }) {
  return (
    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
      {channel.channelType === "forum" ? (
        <ForumIcon />
      ) : channel.channelType === "dm" ? (
        <DmIcon />
      ) : (
        <HashIcon />
      )}
    </div>
  );
}

function ChannelsListSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading channels">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card/60 px-4 py-3"
        >
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
            <div className="h-2 w-2/3 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ChannelsListEmpty() {
  return (
    <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
      <p className="text-sm font-medium">No channels yet</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Join a channel from the desktop app or ask your relay admin for an invite.
      </p>
    </div>
  );
}

function ChannelsListError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <div
      className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">Couldn't load channels</p>
      <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
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

function formatRelativeTime(iso: string | null): string {
  if (!iso) return "";
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return "";
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return "now";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d`;
  return new Date(ts).toLocaleDateString();
}

function HashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <line x1="4" y1="9" x2="20" y2="9" />
      <line x1="4" y1="15" x2="20" y2="15" />
      <line x1="10" y1="3" x2="8" y2="21" />
      <line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  );
}

function ForumIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="14" y2="17" />
    </svg>
  );
}

function DmIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
