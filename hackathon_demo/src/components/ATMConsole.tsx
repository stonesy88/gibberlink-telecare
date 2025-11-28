"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ATM_ACK, ATM_PAYLOAD, createATMClient, createATMServer, type SendMode } from "@/services/AudioMessengerService";

type LogLine = { at: string; text: string };
type Mode = SendMode;

function useLogBuffer() {
  const [lines, setLines] = useState<LogLine[]>([]);

  const push = (text: string) => {
    const at = new Date().toLocaleTimeString();
    setLines(prev => [...prev.slice(-6), { at, text }]);
  };

  const clear = () => setLines([]);

  return { lines, push, clear };
}

export function ATMConsole() {
  const clientLog = useLogBuffer();
  const serverLog = useLogBuffer();

  const [clientState, setClientState] = useState("idle");
  const [serverState, setServerState] = useState("idle");
  const [mode, setMode] = useState<Mode>("plain-70s");

  const clientRef = useRef<ReturnType<typeof createATMClient> | null>(null);
  const serverRef = useRef<ReturnType<typeof createATMServer> | null>(null);

  useEffect(() => {
    clientRef.current = createATMClient({
      onStateChange: setClientState,
      onLog: clientLog.push,
    });
    serverRef.current = createATMServer({
      onStateChange: setServerState,
      onLog: serverLog.push,
    });

    return () => {
      clientRef.current?.dispose();
      serverRef.current?.dispose();
    };
  }, []);

  const messageCopy = useMemo(
    () => ({
      atm: ATM_PAYLOAD,
      ack: ATM_ACK,
    }),
    []
  );

  const stateLabel = {
    "idle": "idle",
    "sending": "sending",
    "waiting": "waiting for ACK",
    "alarm-cleared": "alarm cleared",
    "timeout": "timeout",
    "listening": "listening",
    "hablo-ingles-dtmf": "Hablo Ingles DTMF",
    "very-broke": "Too broke to send",
  } as const;

  return (
    <div className="w-full max-w-5xl mx-auto grid gap-6 md:grid-cols-2">
      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>ATM Client</span>
            <span className="text-sm font-normal px-3 py-1 rounded-full bg-muted">
              State: {stateLabel[clientState as keyof typeof stateLabel] ?? clientState}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>Run two tabs: one client, one server.</span>
            <Button variant="outline" size="sm" className="rounded-full" onClick={() => window.open(window.location.href, "_blank")}>
              Open new tab
            </Button>
          </div>
          <div className="space-y-3">
            <div className="text-sm font-medium">Choose your appetite for DTMF risk</div>
            <div className="space-y-1">
              <input
                type="range"
                min={0}
                max={2}
                step={1}
                value={mode === "very-broke" ? 0 : mode === "broke" ? 1 : 2}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMode(v === 0 ? "very-broke" : v === 1 ? "broke" : "plain-70s");
                }}
                className="w-full accent-foreground"
              />
              <div className="flex justify-between text-xs font-medium">
                <span>Very Broke</span>
                <span>Broke</span>
                <span>Plain ol&apos; Phone 70s Era</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Sends the ATM alarm payload once and waits for ACK.
          </p>
          <div className="flex gap-2">
            <Button
              className="flex-1 rounded-full"
              onClick={() => {
                clientRef.current?.start(mode);
              }}
              disabled={clientState !== "idle"}
            >
              Send ATM
            </Button>
            <Button className="flex-1 rounded-full" variant="outline" onClick={() => clientRef.current?.stop()}>
              Reset
            </Button>
          </div>
          <div className="text-xs font-mono break-words bg-muted/50 rounded-xl p-3 min-h-[120px]">
            <div className="text-muted-foreground mb-1">Log</div>
            {clientLog.lines.map((l, idx) => (
              <div key={idx}>
                [{l.at}] {l.text}
              </div>
            ))}
            {!clientLog.lines.length && <div className="text-muted-foreground">Waiting…</div>}
          </div>
          <div className="text-xs font-mono break-words">
            <div className="text-muted-foreground mb-1">ATM Payload</div>
            {messageCopy.atm}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>ATM Server</span>
            <span className="text-sm font-normal px-3 py-1 rounded-full bg-muted">State: {serverState}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Listens for the ATM alarm payload and responds with ACK via ggwave.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1 rounded-full" onClick={() => serverRef.current?.start()} disabled={serverState === "listening"}>
              Start Server
            </Button>
            <Button className="flex-1 rounded-full" variant="outline" onClick={() => serverRef.current?.stop()}>
              Stop
            </Button>
          </div>
          <div className="text-xs font-mono break-words bg-muted/50 rounded-xl p-3 min-h-[120px]">
            <div className="text-muted-foreground mb-1">Log</div>
            {serverLog.lines.map((l, idx) => (
              <div key={idx}>
                [{l.at}] {l.text}
              </div>
            ))}
            {!serverLog.lines.length && <div className="text-muted-foreground">Waiting…</div>}
          </div>
          <div className="text-xs font-mono break-words">
            <div className="text-muted-foreground mb-1">ACK Payload</div>
            {messageCopy.ack}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
