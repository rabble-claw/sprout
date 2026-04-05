import { useEffect, useMemo, useRef, useState } from "react";
import { RelayClient } from "../api/relaySession";
import type { RelayEvent } from "@sprout-shared/api/types";
import { Button } from "@sprout-shared/ui/button";

export function DevRelayPane() {
  const client = useMemo(() => new RelayClient(), []);
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<RelayEvent[]>([]);
  const unsubRef = useRef<null | (() => Promise<void>)>(null);

  useEffect(() => {
    const unsub = client.subscribeToReconnects(() => setConnected(true));
    return () => unsub();
  }, [client]);

  const preconnect = async () => {
    try {
      await client.preconnect();
      setConnected(true);
    } catch (e) {
      console.error(e);
      setConnected(false);
    }
  };

  const subscribeAll = async () => {
    try {
      const stop = await client.subscribeToAllStreamMessages((ev) => {
        setEvents((prev) => [ev, ...prev].slice(0, 10));
      });
      unsubRef.current = stop;
    } catch (e) {
      console.error(e);
    }
  };

  const unsubscribe = async () => {
    try {
      await unsubRef.current?.();
      unsubRef.current = null;
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="border rounded-md p-3 space-y-2">
      <div className="text-sm font-medium">Dev: Relay WS</div>
      <div className="text-xs text-muted-foreground">Status: {connected ? "connected" : "disconnected"}</div>
      <div className="flex gap-2">
        <Button size="sm" onClick={preconnect}>
          Preconnect
        </Button>
        <Button size="sm" variant="secondary" onClick={subscribeAll}>
          Subscribe all stream msgs
        </Button>
        <Button size="sm" variant="ghost" onClick={unsubscribe}>
          Unsubscribe
        </Button>
      </div>
      <div className="text-xs space-y-1">
        {events.map((e) => (
          <div key={e.id} className="truncate">
            <span className="font-mono text-[10px] text-muted-foreground">{e.created_at}</span>{" "}
            <span className="font-mono text-[10px]">{e.kind}</span>{" "}
            <span className="font-mono text-[10px]">{e.id.slice(0, 10)}</span>{" "}
            <span className="text-muted-foreground">{e.content.slice(0, 80)}</span>
          </div>
        ))}
        {events.length === 0 && <div className="text-muted-foreground">(no events yet)</div>}
      </div>
    </div>
  );
}
