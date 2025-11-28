import { audioMessageEmitter, sendAudioMessage, startRecording } from "@/utils/audioUtils";

// ATM message and ACK payloads
export const ATM_PAYLOAD = "<ATM><Version>1</Version><Type>Alarm</Type><Data>010201</Data><Time>28112500:58</Time></ATM>";
export const ATM_ACK = "<ATM>ACK</ATM>";
const ATM_ACK_REGEX = /^<atm>ack<\/atm>$/i;

type ClientState = "idle" | "sending" | "waiting" | "alarm-cleared" | "timeout" | "very-broke";
type ServerState = "idle" | "listening" | "hablo-ingles-dtmf";

type StateChange<T> = (next: T) => void;
type LogFn = (message: string) => void;

const ATM_REGEX = /<ATM><Version>1<\/Version><Type>Alarm<\/Type><Data>010201<\/Data><Time>28112500:58<\/Time><\/ATM>/i;
const MODE_REGEX = /\|MODE=([A-Z0-9-]+)/i;

function logHelper(logger?: LogFn, message?: string) {
  if (logger && message) logger(message);
}

export type SendMode = "plain-70s" | "broke" | "very-broke";

export function createATMClient(opts?: { onStateChange?: StateChange<ClientState>; onLog?: LogFn; timeoutMs?: number; idleResetMs?: number; ackGuardMs?: number }) {
  const onStateChange = opts?.onStateChange;
  const onLog = opts?.onLog;
  const timeoutMs = opts?.timeoutMs ?? 8000;
  const idleResetMs = opts?.idleResetMs ?? 2000;
  const ackGuardMs = opts?.ackGuardMs ?? 300; // require at least this delay from send to accept ACK

  let state: ClientState = "idle";
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let resetId: ReturnType<typeof setTimeout> | null = null;
  let lastSendAt = 0;

  const setState = (next: ClientState) => {
    state = next;
    onStateChange?.(state);
    logHelper(onLog, `Client state → ${state}`);
  };

  const handleMessage = (incoming: string) => {
    if (state !== "waiting") return;
    const normalized = incoming.trim();
    const upper = normalized.toUpperCase();
    if (Date.now() - lastSendAt < ackGuardMs) return; // ignore premature/stale ACKs
    if (upper === ATM_ACK.toUpperCase() || ATM_ACK_REGEX.test(normalized)) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
      setState("alarm-cleared");
      logHelper(onLog, `ACK received: ${incoming}`);
      if (resetId) clearTimeout(resetId);
      resetId = setTimeout(() => {
        setState("idle");
      }, idleResetMs);
    }
  };

  const start = async (mode: SendMode = "plain-70s") => {
    if (state !== "idle") return;
    await startRecording();

    if (mode === "very-broke") {
      setState("very-broke");
      logHelper(onLog, "Mode: Very Broke selected. ATM not sent.");
      return;
    }

    setState("sending");
    const payload = `${ATM_PAYLOAD}|MODE=${mode.toUpperCase()}`;

    logHelper(onLog, `Sending ATM payload: ${payload}`);
    await sendAudioMessage(payload, true);
    lastSendAt = Date.now();
    setState("waiting");
    timeoutId = setTimeout(() => {
      setState("timeout");
    }, timeoutMs);
  };

  const stop = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
    if (resetId) clearTimeout(resetId);
    resetId = null;
    setState("idle");
  };

  audioMessageEmitter.on("recordingMessage", handleMessage);

  return {
    start,
    stop,
    getState: () => state,
    dispose: () => {
      stop();
      audioMessageEmitter.off("recordingMessage", handleMessage);
    },
  };
}

export function createATMServer(opts?: { onStateChange?: StateChange<ServerState>; onLog?: LogFn }) {
  const onStateChange = opts?.onStateChange;
  const onLog = opts?.onLog;
  let state: ServerState = "idle";
  let resetId: ReturnType<typeof setTimeout> | null = null;

  const setState = (next: ServerState) => {
    state = next;
    onStateChange?.(state);
    logHelper(onLog, `Server state → ${state}`);
    if (state === "hablo-ingles-dtmf") {
      if (resetId) clearTimeout(resetId);
      resetId = setTimeout(() => {
        setState("idle");
      }, 2000);
    }
  };

  const handleMessage = async (incoming: string) => {
    const atmMatch = incoming.match(ATM_REGEX);
    if (!atmMatch) return;

    // Try to detect mode hint from the message (allows cross-tab/server detection)
    const modeMatch = incoming.match(MODE_REGEX);
    const mode = (modeMatch?.[1]?.toLowerCase() as SendMode | undefined) ?? "plain-70s";

    logHelper(onLog, `ATM payload received: ${incoming} (mode: ${mode})`);
    if (mode === "broke") {
      const msg = "Hablo Ingles DTMF - ATM is malformed";
      setState("hablo-ingles-dtmf");
      await sendAudioMessage(msg, true);
      logHelper(onLog, `Sent response: ${msg}`);
      return;
    }
    await sendAudioMessage(ATM_ACK, true);
    logHelper(onLog, `Sent ACK: ${ATM_ACK}`);
  };

  const start = async () => {
    if (state === "listening") return;
    await startRecording();
    setState("listening");
  };

  const stop = () => {
    setState("idle");
  };

  audioMessageEmitter.on("recordingMessage", handleMessage);

  return {
    start,
    stop,
    getState: () => state,
    dispose: () => {
      stop();
      if (resetId) clearTimeout(resetId);
      audioMessageEmitter.off("recordingMessage", handleMessage);
    },
  };
}
