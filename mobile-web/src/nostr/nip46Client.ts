import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { generateSecretKey, getPublicKey, nip04, type Event, SimplePool, finalizeEvent } from "nostr-tools";

export type ConnectUri = {
  remotePubkey: string;
  relays: string[];
  name?: string;
};

export function parseConnectUri(uri: string): ConnectUri {
  const m = uri.match(/^nostr\+?connect:\/\/(\w+)(?:\?(.*))?$/i);
  if (!m) throw new Error("Invalid nostrconnect URI");
  const remotePubkey = m[1];
  const params = new URLSearchParams(m[2] || "");
  const relays = params.getAll("relay");
  const name = params.get("name") || undefined;
  if (!remotePubkey || relays.length === 0) throw new Error("Missing pubkey or relays in URI");
  return { remotePubkey, relays, name };
}

type RpcRequest = { jsonrpc: "2.0"; id: string; method: string; params?: any[] };
type RpcResponse = { jsonrpc: "2.0"; id: string; result?: any; error?: { code: number; message: string } };

export class Nip46Client {
  private pool: SimplePool;
  private sk: Uint8Array;
  public pubkey: string;
  private remotePubkey: string;
  private relays: string[];

  constructor(connect: ConnectUri, skHex?: string) {
    this.pool = new SimplePool();
    this.sk = skHex ? hexToBytes(skHex) : generateSecretKey();
    this.pubkey = getPublicKey(this.sk);
    this.remotePubkey = connect.remotePubkey;
    this.relays = connect.relays;
  }

  persist(key = "nip46_sk"): void {
    try { localStorage.setItem(key, bytesToHex(this.sk)); } catch {}
  }

  static tryLoad(connect: ConnectUri, key = "nip46_sk"): Nip46Client | null {
    try {
      const skHex = localStorage.getItem(key) || undefined;
      return new Nip46Client(connect, skHex);
    } catch { return null; }
  }

  private async call(method: string, params: any[] = []): Promise<any> {
    const id = Math.random().toString(36).slice(2);
    const req: RpcRequest = { jsonrpc: "2.0", id, method, params };
    const plaintext = JSON.stringify(req);
    const encrypted = await nip04.encrypt(this.sk, this.remotePubkey, plaintext);
    const ev: Omit<Event, "id" | "sig"> = {
      kind: 24133,
      created_at: Math.floor(Date.now() / 1000),
      content: encrypted,
      tags: [["p", this.remotePubkey], ...this.relays.map((r) => ["r", r] as string[])],
      pubkey: this.pubkey,
    } as any;
    const finalized = finalizeEvent(ev as any, this.sk);
    await this.pool.publish(this.relays, finalized as Event);

    return await new Promise((resolve, reject) => {
      const sub = (this.pool as any).subscribeMany(
        this.relays,
        [{ kinds: [24133], authors: [this.remotePubkey], "#p": [this.pubkey] }],
        {
          onevent: async (msg: any) => {
            try {
              const text = await nip04.decrypt(this.sk, msg.pubkey, msg.content);
              const resp: RpcResponse = JSON.parse(text);
              if (resp.id !== id) return;
              sub.close();
              if (resp.error) reject(new Error(resp.error.message));
              else resolve(resp.result);
            } catch (e) {
              // ignore
            }
          },
          oneose: () => {},
        },
      );
      setTimeout(() => {
        try { sub.close(); } catch {}
        reject(new Error("nip46 timeout"));
      }, 15000);
    });
  }

  async connect(appName = "Sprout Web"): Promise<void> {
    await this.call("connect", [appName, ["sign_event", "get_public_key"]]);
  }

  async getPublicKey(): Promise<string> {
    return await this.call("get_public_key");
  }

  async signEvent(ev: any): Promise<{ sig: string }> {
    const sig: string = await this.call("sign_event", [ev]);
    return { sig };
  }
}
