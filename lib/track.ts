/**
 * Anonymous usage tracking. Sends METADATA ONLY (tool, action, byte sizes, counts, timings,
 * short error text) — never file names or file contents. Never throws.
 */
export type TrackAction = "view" | "start" | "success" | "error" | "download";
export type TrackEvent = {
  tool: string;
  preset?: string;
  action: TrackAction;
  inBytes?: number;
  outBytes?: number;
  count?: number;
  durationMs?: number;
  error?: string;
};

type Payload = TrackEvent & { session: string; path: string; referrer?: string };

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const ENDPOINT = "/api/track";
const MAX_BATCH = 20;
const DEBOUNCE_MS = 1500;
const disabled = process.env.NEXT_PUBLIC_TRACKING_DISABLED === "1";

const queue: Payload[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listening = false;
let sessionId: string | null = null;

function getSession(): string {
  if (sessionId) return sessionId;
  try {
    const existing = sessionStorage.getItem("dly_sid");
    if (existing) return (sessionId = existing);
  } catch {}
  let id: string;
  try {
    id = crypto.randomUUID().replace(/-/g, "");
  } catch {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
  try {
    sessionStorage.setItem("dly_sid", id);
  } catch {}
  return (sessionId = id);
}

function referrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined;
    const host = new URL(document.referrer).hostname;
    return host && host !== location.hostname ? host : undefined;
  } catch {
    return undefined;
  }
}

/** Defensive scrub: drop anything that looks like a file name or path from error text. */
function scrubError(msg?: string): string | undefined {
  if (!msg) return undefined;
  return String(msg)
    .replace(/[^\s"'`/\\]+\.(pdf|jpe?g|png|webp|heic|heif|gif|bmp|tiff?|docx?|txt)\b/gi, "<file>")
    .replace(/(?:[a-z]:)?[\\/][^\s"'`]*/gi, "<path>")
    .slice(0, 160);
}

function num(v?: number): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? Math.max(0, Math.round(v)) : undefined;
}

function send(batch: Payload[]) {
  if (!batch.length) return;
  const body = JSON.stringify(batch);
  try {
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, blob)) return;
  } catch {}
  try {
    fetch(ENDPOINT, {
      method: "POST",
      body,
      keepalive: true,
      headers: { "content-type": "application/json" },
      credentials: "same-origin",
    }).catch(() => {});
  } catch {}
}

function flush() {
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  while (queue.length) send(queue.splice(0, MAX_BATCH));
}

function listen() {
  if (listening) return;
  listening = true;
  try {
    addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
    });
  } catch {}
}

function toGa(e: TrackEvent) {
  try {
    const gtag = (window as GtagWindow).gtag;
    if (typeof gtag !== "function") return;
    gtag("event", `tool_${e.action}`, {
      tool: e.tool,
      preset: e.preset,
      in_bytes: e.inBytes,
      out_bytes: e.outBytes,
      file_count: e.count,
      duration_ms: e.durationMs,
      error_message: e.action === "error" ? scrubError(e.error) : undefined,
    });
  } catch {}
}

export function track(e: TrackEvent): void {
  if (disabled || typeof window === "undefined") return;
  try {
    if (!e || !e.tool || !e.action) return;
    toGa(e);
    listen();
    queue.push({
      tool: e.tool,
      preset: e.preset || undefined,
      action: e.action,
      inBytes: num(e.inBytes),
      outBytes: num(e.outBytes),
      count: num(e.count),
      durationMs: num(e.durationMs),
      error: e.action === "error" ? scrubError(e.error) : undefined,
      session: getSession(),
      path: location.pathname,
      referrer: referrerHost(),
    });
    if (queue.length >= MAX_BATCH) return flush();
    if (!timer) timer = setTimeout(flush, DEBOUNCE_MS);
  } catch {}
}
