import type {
  AddChannelMembersInput,
  AddChannelMembersResult,
  CanvasResponse,
  Channel,
  ChannelDetail,
  ChannelMember,
  CreateChannelInput,
  GetHomeFeedInput,
  HomeFeedResponse,
  Identity,
  MintTokenInput,
  MintTokenResponse,
  OpenDmInput,
  PresenceLookup,
  PresenceStatus,
  Profile,
  RelayAgent,
  RelayEvent,
  SearchMessagesInput,
  SearchMessagesResponse,
  SetCanvasInput,
  SetCanvasResult,
  SetChannelPurposeInput,
  SetChannelTopicInput,
  SendChannelMessageResult,
  Token,
  UpdateChannelInput,
  UpdateProfileInput,
  UserSearchResult,
  UsersBatchResponse,
} from "@sprout-shared/api/types";
import { deleteJson, getJson, postJson, putJson } from "../api/authFetch";
import {
  RawChannel,
  RawChannelDetail,
  RawChannelMember,
  RawProfile,
  RawRelayAgent,
  RawSearchHit,
  RawToken,
  RawUserProfileSummary,
  RawUserSearchResult,
  fromRawChannel,
  fromRawChannelDetail,
  fromRawChannelMember,
  fromRawProfile,
  fromRawRelayAgent,
  fromRawSearchHit,
  fromRawToken,
  fromRawUserProfileSummary,
  fromRawUserSearchResult,
} from "./converters";

export async function getIdentity(): Promise<Identity> {
  const p = await getProfile();
  return { pubkey: p.pubkey, displayName: p.displayName ?? p.pubkey.slice(0, 8) };
}

export async function getProfile(): Promise<Profile> {
  const profile = await getJson<RawProfile>("/api/users/me/profile");
  return fromRawProfile(profile);
}

export async function updateProfile(_input: UpdateProfileInput): Promise<Profile> {
  throw new Error("updateProfile is not available via REST in mobile-web");
}

export async function getUserProfile(pubkey?: string): Promise<Profile> {
  if (!pubkey) return getProfile();
  const profile = await getJson<RawProfile>(`/api/users/${pubkey}/profile`);
  return fromRawProfile(profile);
}

export async function getUsersBatch(pubkeys: string[]): Promise<UsersBatchResponse> {
  const res = await postJson<{ profiles: Record<string, RawUserProfileSummary>; missing: string[] }>(
    "/api/users/batch",
    { pubkeys },
  );
  return {
    profiles: Object.fromEntries(
      Object.entries(res.profiles).map(([k, v]) => [k, fromRawUserProfileSummary(v)]),
    ),
    missing: res.missing,
  };
}

export async function searchUsers(query: string, limit = 8): Promise<UserSearchResult[]> {
  const res = await getJson<{ users: RawUserSearchResult[] }>(
    `/api/users/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  );
  return res.users.map(fromRawUserSearchResult);
}

export async function getPresence(pubkeys: string[]): Promise<PresenceLookup> {
  const qs = pubkeys.join(",");
  const res = await getJson<Record<string, PresenceStatus>>(
    `/api/presence?pubkeys=${encodeURIComponent(qs)}`,
  );
  const out: PresenceLookup = {};
  for (const [k, v] of Object.entries(res)) out[k.toLowerCase()] = v;
  return out;
}

export async function setPresence(status: PresenceStatus) {
  const res = await putJson<{ status: PresenceStatus; ttl_seconds: number }>(
    "/api/presence",
    { status },
  );
  return { status: res.status, ttlSeconds: res.ttl_seconds };
}

export async function getChannels(): Promise<Channel[]> {
  const channels = await getJson<RawChannel[]>("/api/channels");
  return channels.map(fromRawChannel);
}

export async function createChannel(_input: CreateChannelInput): Promise<Channel> {
  throw new Error("createChannel is not available via REST in mobile-web");
}

export async function openDm(input: OpenDmInput): Promise<Channel> {
  const r = await postJson<{ channel_id: string }>("/api/dms", { pubkeys: input.pubkeys });
  return getChannelDetails(r.channel_id);
}

export async function hideDm(channelId: string): Promise<void> {
  await postJson(`/api/dms/${channelId}/hide`, {});
}

export async function getChannelDetails(channelId: string): Promise<ChannelDetail> {
  const c = await getJson<RawChannelDetail>(`/api/channels/${channelId}`);
  return fromRawChannelDetail(c);
}

export async function getChannelMembers(channelId: string): Promise<ChannelMember[]> {
  const res = await getJson<{ members: RawChannelMember[] }>(
    `/api/channels/${channelId}/members`,
  );
  return res.members.map(fromRawChannelMember);
}

export async function updateChannel(_input: UpdateChannelInput): Promise<ChannelDetail> {
  throw new Error("updateChannel is not available via REST in mobile-web");
}

export async function setChannelTopic(_input: SetChannelTopicInput): Promise<void> {
  throw new Error("setChannelTopic is not available via REST in mobile-web");
}

export async function setChannelPurpose(_input: SetChannelPurposeInput): Promise<void> {
  throw new Error("setChannelPurpose is not available via REST in mobile-web");
}

export async function archiveChannel(_channelId: string): Promise<void> {
  throw new Error("archiveChannel is not available via REST in mobile-web");
}

export async function unarchiveChannel(_channelId: string): Promise<void> {
  throw new Error("unarchiveChannel is not available via REST in mobile-web");
}

export async function deleteChannel(_channelId: string): Promise<void> {
  throw new Error("deleteChannel is not available via REST in mobile-web");
}

export async function addChannelMembers(
  _input: AddChannelMembersInput,
): Promise<AddChannelMembersResult> {
  throw new Error("addChannelMembers is not available via REST in mobile-web");
}

export async function removeChannelMember(_channelId: string, _pubkey: string): Promise<void> {
  throw new Error("removeChannelMember is not available via REST in mobile-web");
}

export async function joinChannel(_channelId: string): Promise<void> {
  throw new Error("joinChannel is not available via REST in mobile-web");
}

export async function leaveChannel(_channelId: string): Promise<void> {
  throw new Error("leaveChannel is not available via REST in mobile-web");
}

export async function getCanvas(channelId: string): Promise<CanvasResponse> {
  const res = await getJson<{ content: string | null; updated_at?: number; author?: string | null }>(
    `/api/channels/${channelId}/canvas`,
  );
  return { content: res.content, updatedAt: res.updated_at ?? null, author: res.author ?? null };
}

export async function setCanvas(_input: SetCanvasInput): Promise<SetCanvasResult> {
  throw new Error("setCanvas is not available via REST in mobile-web");
}

export async function getHomeFeed(input: GetHomeFeedInput = {}): Promise<HomeFeedResponse> {
  const params = new URLSearchParams();
  if (input.since != null) params.set("since", String(input.since));
  if (input.limit != null) params.set("limit", String(input.limit));
  if (input.types != null) params.set("types", input.types);
  const res = await getJson<{
    feed: { mentions: any[]; needs_action: any[]; activity: any[]; agent_activity: any[] };
    meta: { since: number; total: number; generated_at: number };
  }>(`/api/feed?${params.toString()}`);
  return {
    feed: {
      mentions: res.feed.mentions.map((i: any) => fromRawFeed(i)),
      needsAction: res.feed.needs_action.map((i: any) => fromRawFeed(i)),
      activity: res.feed.activity.map((i: any) => fromRawFeed(i)),
      agentActivity: res.feed.agent_activity.map((i: any) => fromRawFeed(i)),
    },
    meta: { since: res.meta.since, total: res.meta.total, generatedAt: res.meta.generated_at },
  };
}

function fromRawFeed(i: any) {
  return {
    id: i.id,
    kind: i.kind,
    pubkey: i.pubkey,
    content: i.content,
    createdAt: i.created_at,
    channelId: i.channel_id ?? null,
    channelName: i.channel_name ?? "",
    tags: i.tags,
    category: i.category,
  };
}

export async function searchMessages(input: SearchMessagesInput): Promise<SearchMessagesResponse> {
  const params = new URLSearchParams();
  params.set("q", input.q);
  if (input.limit != null) params.set("limit", String(input.limit));
  const res = await getJson<{ hits: RawSearchHit[]; found: number }>(
    `/api/search?${params.toString()}`,
  );
  return { hits: res.hits.map(fromRawSearchHit), found: res.found };
}

export async function getEventById(eventId: string): Promise<RelayEvent> {
  return await getJson<RelayEvent>(`/api/events/${eventId}`);
}

export async function sendChannelMessage(
  _channelId: string,
  _content: string,
  _parentEventId?: string | null,
  _mediaTags?: string[][],
  _mentionPubkeys?: string[],
  _kind?: number,
): Promise<SendChannelMessageResult> {
  throw new Error("sendChannelMessage is not available via REST in mobile-web");
}

export type BlobDescriptor = {
  url: string;
  sha256: string;
  size: number;
  type: string;
  uploaded: number;
  dim?: string;
  blurhash?: string;
  thumb?: string;
};

export async function uploadMediaBytes(_data: number[]): Promise<BlobDescriptor> {
  throw new Error("uploadMediaBytes requires Blossom NIP-98; implemented in Phase 4");
}

export async function editMessage(
  _channelId: string,
  _eventId: string,
  _content: string,
): Promise<void> {
  throw new Error("editMessage is not available via REST in mobile-web");
}

export async function deleteMessage(_eventId: string): Promise<void> {
  throw new Error("deleteMessage is not available via REST in mobile-web");
}

export async function addReaction(_eventId: string, _emoji: string): Promise<void> {
  throw new Error("addReaction is not available via REST in mobile-web");
}

export async function removeReaction(_eventId: string, _emoji: string): Promise<void> {
  throw new Error("removeReaction is not available via REST in mobile-web");
}

export async function listTokens(): Promise<Token[]> {
  const res = await getJson<{ tokens: RawToken[] }>("/api/tokens");
  return res.tokens.map(fromRawToken);
}

export async function mintToken(input: MintTokenInput): Promise<MintTokenResponse> {
  const body: any = { name: input.name, scopes: input.scopes };
  if (input.channelIds) body.channel_ids = input.channelIds;
  if (input.expiresInDays != null) body.expires_in_days = input.expiresInDays;
  const res = await postJson<{
    id: string;
    token: string;
    name: string;
    scopes: string[];
    channel_ids: string[];
    created_at: string;
    expires_at: string | null;
  }>("/api/tokens", body);
  return {
    id: res.id,
    token: res.token,
    name: res.name,
    scopes: res.scopes as Token["scopes"],
    channelIds: res.channel_ids,
    createdAt: res.created_at,
    expiresAt: res.expires_at,
  };
}

export async function revokeToken(tokenId: string): Promise<void> {
  await deleteJson(`/api/tokens/${tokenId}`);
}

export async function revokeAllTokens(): Promise<{ revokedCount: number }> {
  const res = await deleteJson<{ revoked_count: number }>("/api/tokens");
  return { revokedCount: res.revoked_count };
}

export async function listRelayAgents(): Promise<RelayAgent[]> {
  const res = await getJson<RawRelayAgent[]>("/api/agents");
  return res.map(fromRawRelayAgent);
}

