import { getBaseUrl } from "./authFetch";

function bytesToHex(bytes: ArrayBuffer): string {
  const arr = new Uint8Array(bytes);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return bytesToHex(digest);
}

export type MintInput = {
  name: string;
  scopes: string[];
  channelIds?: string[];
  ownerPubkey?: string;
};

/**
 * Mint a sprout_* API token via NIP-98 using a NIP-07 signer.
 * Sends Authorization: Nostr <base64(JSON event)> with kind:27235 and u/method/payload tags.
 */
export async function mintTokenViaNip07(input: MintInput): Promise<{ id: string; token: string }>{
  if (!window.nostr?.signEvent) throw new Error("NIP-07 extension required");

  const url = new URL("/api/tokens", getBaseUrl());
  const body = {
    name: input.name,
    scopes: input.scopes,
    channel_ids: input.channelIds,
    owner_pubkey: input.ownerPubkey,
  };
  const bodyBytes = new TextEncoder().encode(JSON.stringify(body));
  const payloadHex = await sha256Hex(bodyBytes);

  const created_at = Math.floor(Date.now() / 1000);
  const tags: string[][] = [
    ["u", url.toString()],
    ["method", "POST"],
    ["payload", payloadHex],
  ];
  const event = await window.nostr.signEvent({
    kind: 27235, // Kind::HttpAuth
    created_at,
    content: "",
    tags,
  });
  const eventJson = new TextEncoder().encode(JSON.stringify(event));
  const authHeader = `Nostr ${bytesToBase64(eventJson)}`;

  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Authorization": authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) message = data.message;
    } catch {}
    throw new Error(message);
  }
  const data = await res.json();
  return { id: data.id as string, token: data.token as string };
}

