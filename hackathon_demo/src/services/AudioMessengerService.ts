import { audioMessageEmitter, sendAudioMessage, startRecording } from "@/utils/audioUtils";

// ATM message and ACK payloads
export const ATM_PAYLOAD = "<ATM><Version>1</Version><Type>Alarm</Type><Data>010201</Data><Time>28112500:58</Time></ATM>";
export const ATM_ACK = "<ATM>ACK</ATM>";

type ClientState = "idle" | "sending" | "waiting" | "acked" | "timeout";
type ServerState = "idle" | "listening";

type StateChange<T> = (next: T) => void;
type LogFn = (message: string) => void;

const ATM_REGEX = /<ATM><Version>1<\/Version><Type>Alarm<\/Type><Data>010201<\/Data><Time>28112500:58<\/Time><\/ATM>/i;

function logHelper(logger?: LogFn, message?: string) {
  if (logger && message) logger(message);
}

export function createATMClient(opts?: { onStateChange?: StateChange<ClientState>; onLog?: LogFn; timeoutMs?: number }) {
  const onStateChange = opts?.onStateChange;
  const onLog = opts?.onLog;
  const timeoutMs = opts?.timeoutMs ?? 8000;

  let state: ClientState = "idle";
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const setState = (next: ClientState) => {
    state = next;
    onStateChange?.(state);
    logHelper(onLog, `Client state → ${state}`);
  };

  const handleMessage = (incoming: string) => {
    if (state !== "waiting") return;
    if (incoming.includes(ATM_ACK)) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = null;
      setState("acked");
    }
  };

  const start = async () => {
    if (state !== "idle") return;
    await startRecording();
    setState("sending");
    logHelper(onLog, `Sending ATM payload: ${ATM_PAYLOAD}`);
    await sendAudioMessage(ATM_PAYLOAD, true);
    setState("waiting");
    timeoutId = setTimeout(() => {
      setState("timeout");
    }, timeoutMs);
  };

  const stop = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
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

  const setState = (next: ServerState) => {
    state = next;
    onStateChange?.(state);
    logHelper(onLog, `Server state → ${state}`);
  };

  const handleMessage = async (incoming: string) => {
    if (!ATM_REGEX.test(incoming)) return;
    logHelper(onLog, `ATM payload received: ${incoming}`);
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
      audioMessageEmitter.off("recordingMessage", handleMessage);
    },
  };
}
