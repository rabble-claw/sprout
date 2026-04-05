// ABOUTME: Mobile-first channel detail screen — metadata, members, and a messages placeholder.
// ABOUTME: Reads :channelId from the route; live messages are gated on a future Nostr signer.
import type { ChannelDetail, ChannelMember } from "@sprout-shared/api/types";
import { matchPath, useRoute } from "../../../lib/router";
import { useChannelDetail } from "./useChannelDetail";
import { useChannelMembers } from "./useChannelMembers";

export function ChannelDetailPage() {
  const route = useRoute();
  const params = matchPath("/channels/:channelId", route.pathname);
  const channelId = params?.channelId ?? null;

  if (!channelId) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-10 text-center">
        <p className="text-sm font-medium">Channel not found</p>
        <p className="mt-1 text-xs text-muted-foreground">
          The URL doesn't match a channel. Head back to the channels list and try again.
        </p>
      </div>
    );
  }

  return <ChannelDetailContent channelId={channelId} />;
}

function ChannelDetailContent({ channelId }: { channelId: string }) {
  const detailState = useChannelDetail(channelId);
  const membersState = useChannelMembers(channelId);

  return (
    <div className="space-y-5">
      <DetailHeaderSection state={detailState} />
      <MessagesPlaceholderSection />
      <MembersSection state={membersState} />
    </div>
  );
}

function DetailHeaderSection({
  state,
}: {
  state: ReturnType<typeof useChannelDetail>;
}) {
  const { detail, loading, error, refetch } = state;

  if (loading && !detail) {
    return <DetailHeaderSkeleton />;
  }

  if (error && !detail) {
    return <SectionError title="Couldn't load channel" error={error} onRetry={refetch} />;
  }

  if (!detail) return null;

  return (
    <section aria-labelledby="channel-detail-header">
      <div className="rounded-2xl border border-border/60 bg-card/60 px-4 py-4">
        <div className="flex items-start gap-2">
          <h1
            id="channel-detail-header"
            className="min-w-0 flex-1 truncate text-base font-semibold"
          >
            {detail.name}
          </h1>
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {detail.channelType}
          </span>
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          {detail.memberCount} {detail.memberCount === 1 ? "member" : "members"}
        </p>
        {detail.topic ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Topic
            </p>
            <p className="mt-1 text-sm leading-snug">{detail.topic}</p>
          </div>
        ) : null}
        {detail.description ? (
          <div className="mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm leading-snug text-muted-foreground">
              {detail.description}
            </p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function MessagesPlaceholderSection() {
  return (
    <section aria-labelledby="channel-detail-messages">
      <h2
        id="channel-detail-messages"
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        Messages
      </h2>
      <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center">
        <p className="text-sm font-medium">Live messages coming soon</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Live messages require a Nostr signer. Not yet available in the web app.
        </p>
      </div>
    </section>
  );
}

function MembersSection({
  state,
}: {
  state: ReturnType<typeof useChannelMembers>;
}) {
  const { members, loading, error, refetch } = state;

  return (
    <section aria-labelledby="channel-detail-members">
      <h2
        id="channel-detail-members"
        className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
      >
        Members
      </h2>
      {loading && members.length === 0 ? (
        <MembersSkeleton />
      ) : error && members.length === 0 ? (
        <SectionError title="Couldn't load members" error={error} onRetry={refetch} />
      ) : members.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/40 px-4 py-6 text-center">
          <p className="text-sm font-medium">No members yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Members will appear here once they join.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-border/60 rounded-2xl border border-border/60 bg-card/60">
          {members.map((member) => (
            <li key={member.pubkey}>
              <MemberRow member={member} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function MemberRow({ member }: { member: ChannelMember }) {
  const label = displayLabel(member);
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 first:rounded-t-2xl last:rounded-b-2xl"
      data-testid={`channel-member-${member.pubkey}`}
    >
      <MemberAvatar label={label} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{label}</p>
        <p className="truncate text-[11px] text-muted-foreground">{shortPubkey(member.pubkey)}</p>
      </div>
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {member.role}
      </span>
    </div>
  );
}

function MemberAvatar({ label }: { label: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-sm font-semibold text-secondary-foreground">
      {avatarInitials(label)}
    </div>
  );
}

function DetailHeaderSkeleton() {
  return (
    <div
      className="rounded-2xl border border-border/60 bg-card/60 px-4 py-4"
      aria-busy="true"
      aria-label="Loading channel"
    >
      <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-2 w-1/5 animate-pulse rounded bg-muted" />
      <div className="mt-4 h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-2 h-3 w-2/3 animate-pulse rounded bg-muted" />
    </div>
  );
}

function MembersSkeleton() {
  return (
    <ul className="space-y-2" aria-busy="true" aria-label="Loading members">
      {Array.from({ length: 4 }).map((_, i) => (
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

function SectionError({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: Error;
  onRetry: () => void;
}) {
  return (
    <div
      className="rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
      role="alert"
    >
      <p className="text-sm font-medium text-destructive">{title}</p>
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

function displayLabel(member: ChannelMember): string {
  const name = member.displayName?.trim();
  if (name) return name;
  return shortPubkey(member.pubkey);
}

function shortPubkey(pubkey: string): string {
  if (pubkey.length <= 12) return pubkey;
  return `${pubkey.slice(0, 6)}…${pubkey.slice(-4)}`;
}

function avatarInitials(label: string): string {
  const cleaned = label.replace(/[^\p{L}\p{N} ]+/gu, "").trim();
  if (!cleaned) return "?";
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
