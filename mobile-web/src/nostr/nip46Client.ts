import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey, nip44, SimplePool, finalizeEvent } from "nostr-tools";

export type ConnectUri = {
  remotePubkey: string;
  relays: string[];
  name?: string;
  secret?: string;
};

// Accepts bunker:// and nostrconnect:// URIs per NIP-46. For nostrconnect://
// the pubkey in the URI is the client's, not the remote signer's — that flow
// needs an extra handshake step not yet implemented here.
export function parseConnectUri(uri: string): ConnectUri {
  const m = uri.match(/^(?:bunker|nostr\+?connect):\/\/([0-9a-f]+)(?:\?(.*))?$/i);
  if (!m) throw new Error("Invalid NIP-46 connect URI");
  const remotePubkey = m[1];
  const params = new URLSearchParams(m[2] || "");
  const relays = params.getAll("relay");
  const name = params.get("name") || undefined;
  const secret = params.get("secret") || undefined;
  if (!remotePubkey || relays.length === 0) throw new Error("Missing pubkey or relays in URI");
  return { remotePubkey, relays, name, secret };
}

type RpcRequest = { id: string; method: string; params: string[] };
type RpcResponse = { id: string; result?: string; error?: string };

export class Nip46Client {
  private pool: SimplePool;
  private sk: Uint8Array;
  public pubkey: string;
  private remotePubkey: string;
  private relays: string[];
  private secret?: string;
  private convKey: Uint8Array;

  constructor(connect: ConnectUri, skHex?: string) {
    this.pool = new SimplePool();
    this.sk = skHex ? hexToBytes(skHex) : generateSecretKey();
    this.pubkey = getPublicKey(this.sk);
    this.remotePubkey = connect.remotePubkey;
    this.relays = connect.relays;
    this.secret = connect.secret;
    this.convKey = nip44.getConversationKey(this.sk, this.remotePubkey);
  }

  persist(key = "nip46_sk"): void {
    try { localStorage.setItem(key, bytesToHex(this.sk)); } catch {}
  }

  static tryLoad(connect: ConnectUri, key = "nip46_sk"): Nip46Client | null {
    try {
      const skHex = localStorage.getItem(key) || undefined;
      const client = new Nip46Client(connect, skHex);
      // Persist a freshly-generated key so our client identity is stable
      // across reloads; the bunker's granted perms are tied to this pubkey.
      if (!skHex) client.persist(key);
      return client;
    } catch { return null; }
  }

  private async call(method: string, params: string[] = []): Promise<string> {
    const id = Math.random().toString(36).slice(2);
    const req: RpcRequest = { id, method, params };
    const encrypted = nip44.encrypt(JSON.stringify(req), this.convKey);
    const finalized = finalizeEvent(
      {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        content: encrypted,
        tags: [["p", this.remotePubkey]],
      },
      this.sk,
    );

    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try { sub.close(); } catch {}
        fn();
      };
      // Subscribe before publishing so a fast bunker response can't race past us.
      const sub = this.pool.subscribeMany(
        this.relays,
        { kinds: [24133], authors: [this.remotePubkey], "#p": [this.pubkey] },
        {
          onevent: (msg) => {
            try {
              const text = nip44.decrypt(msg.content, this.convKey);
              const resp: RpcResponse = JSON.parse(text);
              if (resp.id !== id) return;
              if (resp.error) finish(() => reject(new Error(resp.error)));
              else finish(() => resolve(resp.result ?? ""));
            } catch {
              // Not one of our responses — keep waiting.
            }
          },
        },
      );
      const timer = setTimeout(() => {
        finish(() => reject(new Error("nip46 timeout")));
      }, 15000);

      // Fire-and-forget: pool.publish returns one promise per relay. The 15s
      // timeout above is our only deadline — we don't want to block on a slow
      // relay when a faster one may already have delivered the request.
      Promise.allSettled(this.pool.publish(this.relays, finalized)).then((r) => {
        if (r.every((x) => x.status === "rejected")) {
          finish(() => reject(new Error("nip46 publish failed on all relays")));
        }
      });
    });
  }

  async connect(): Promise<void> {
    // Spec: connect params are [<remote-signer-pubkey>, <secret>, <perms csv>].
    await this.call("connect", [this.remotePubkey, this.secret ?? "", "sign_event,get_public_key"]);
  }

  async getPublicKey(): Promise<string> {
    return await this.call("get_public_key");
  }

  async signEvent(ev: { kind: number; created_at: number; tags: string[][]; content: string }): Promise<{
    id: string;
    pubkey: string;
    sig: string;
    kind: number;
    created_at: number;
    tags: string[][];
    content: string;
  }> {
    // Per NIP-46 the result for sign_event is the full signed event JSON string.
    const raw = await this.call("sign_event", [JSON.stringify(ev)]);
    return JSON.parse(raw);
  }
}
