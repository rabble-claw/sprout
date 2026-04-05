import type {
  Channel,
  ChannelDetail,
  ChannelMember,
  ChannelType,
  HomeFeedResponse,
  Profile,
  RelayAgent,
  SearchMessagesResponse,
  Token,
  UserProfileSummary,
  UserSearchResult,
} from "@sprout-shared/api/types";

export type RawProfile = {
  pubkey: string;
  display_name: string | null;
  avatar_url: string | null;
  about: string | null;
  nip05_handle: string | null;
};

export function fromRawProfile(p: RawProfile): Profile {
  return {
    pubkey: p.pubkey,
    displayName: p.display_name,
    avatarUrl: p.avatar_url,
    about: p.about,
    nip05Handle: p.nip05_handle,
  };
}

export type RawUserProfileSummary = {
  display_name: string | null;
  avatar_url: string | null;
  nip05_handle: string | null;
};

export function fromRawUserProfileSummary(
  s: RawUserProfileSummary,
): UserProfileSummary {
  return {
    displayName: s.display_name,
    avatarUrl: s.avatar_url,
    nip05Handle: s.nip05_handle,
  };
}

export type RawUserSearchResult = {
  pubkey: string;
  display_name: string | null;
  avatar_url: string | null;
  nip05_handle: string | null;
};

export function fromRawUserSearchResult(u: RawUserSearchResult): UserSearchResult {
  return {
    pubkey: u.pubkey,
    displayName: u.display_name,
    avatarUrl: u.avatar_url,
    nip05Handle: u.nip05_handle,
  };
}

export type RawChannel = {
  id: string;
  name: string;
  channel_type: ChannelType;
  visibility: "open" | "private";
  description: string;
  topic: string | null;
  purpose: string | null;
  member_count: number;
  last_message_at: string | null;
  archived_at: string | null;
  participants?: string[];
  participant_pubkeys?: string[];
  is_member?: boolean;
};

export function fromRawChannel(c: RawChannel): Channel {
  return {
    id: c.id,
    name: c.name,
    channelType: c.channel_type,
    visibility: c.visibility,
    description: c.description,
    topic: c.topic,
    purpose: c.purpose,
    memberCount: c.member_count,
    lastMessageAt: c.last_message_at,
    archivedAt: c.archived_at,
    participants: c.participants ?? [],
    participantPubkeys: c.participant_pubkeys ?? [],
    isMember: c.is_member ?? true,
  };
}

export type RawChannelDetail = RawChannel & {
  created_by: string;
  created_at: string;
  updated_at: string;
  topic_set_by: string | null;
  topic_set_at: string | null;
  purpose_set_by: string | null;
  purpose_set_at: string | null;
  topic_required: boolean;
  max_members: number | null;
  nip29_group_id: string | null;
};

export function fromRawChannelDetail(c: RawChannelDetail): ChannelDetail {
  return {
    ...fromRawChannel(c),
    createdBy: c.created_by,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
    topicSetBy: c.topic_set_by,
    topicSetAt: c.topic_set_at,
    purposeSetBy: c.purpose_set_by,
    purposeSetAt: c.purpose_set_at,
    topicRequired: c.topic_required,
    maxMembers: c.max_members,
    nip29GroupId: c.nip29_group_id,
  };
}

export type RawChannelMember = {
  pubkey: string;
  role: ChannelMember["role"];
  joined_at: string;
  display_name: string | null;
};

export function fromRawChannelMember(m: RawChannelMember): ChannelMember {
  return {
    pubkey: m.pubkey,
    role: m.role,
    joinedAt: m.joined_at,
    displayName: m.display_name,
  };
}

export type RawFeedItem = {
  id: string;
  kind: number;
  pubkey: string;
  content: string;
  created_at: number;
  channel_id: string | null;
  channel_name: string;
  tags: string[][];
  category: "mention" | "needs_action" | "activity" | "agent_activity";
};

export function fromRawFeedItem(i: RawFeedItem) {
  return {
    id: i.id,
    kind: i.kind,
    pubkey: i.pubkey,
    content: i.content,
    createdAt: i.created_at,
    channelId: i.channel_id,
    channelName: i.channel_name,
    tags: i.tags,
    category: i.category,
  } as HomeFeedResponse["feed"]["mentions"][number];
}

export type RawSearchHit = {
  event_id: string;
  content: string;
  kind: number;
  pubkey: string;
  channel_id: string;
  channel_name: string;
  created_at: number;
  score: number;
};

export function fromRawSearchHit(h: RawSearchHit) {
  return {
    eventId: h.event_id,
    content: h.content,
    kind: h.kind,
    pubkey: h.pubkey,
    channelId: h.channel_id,
    channelName: h.channel_name,
    createdAt: h.created_at,
    score: h.score,
  } satisfies SearchMessagesResponse["hits"][number];
}

export type RawToken = {
  id: string;
  name: string;
  scopes: string[];
  channel_ids: string[];
  created_at: string;
  expires_at: string | null;
  last_used_at: string | null;
  revoked_at: string | null;
};

export function fromRawToken(t: RawToken): Token {
  return {
    id: t.id,
    name: t.name,
    scopes: t.scopes as Token["scopes"],
    channelIds: t.channel_ids,
    createdAt: t.created_at,
    expiresAt: t.expires_at,
    lastUsedAt: t.last_used_at,
    revokedAt: t.revoked_at,
  };
}

export type RawRelayAgent = {
  pubkey: string;
  name: string;
  agent_type: string;
  channels: string[];
  channel_ids: string[];
  capabilities: string[];
  status: RelayAgent["status"];
};

export function fromRawRelayAgent(a: RawRelayAgent): RelayAgent {
  return {
    pubkey: a.pubkey,
    name: a.name,
    agentType: a.agent_type,
    channels: a.channels,
    channelIds: a.channel_ids ?? [],
    capabilities: a.capabilities,
    status: a.status,
  };
}

