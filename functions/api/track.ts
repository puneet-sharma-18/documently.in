/**
 * POST /api/track — anonymous tool-usage metadata.
 *
 * Accepts one event object or an array of up to 20. Every field is whitelisted, clamped and
 * truncated; device, browser and country are derived here from request headers so the client
 * never sends (and we never store) the raw user agent or IP address.
 *
 * Abuse protection (kept deliberately simple):
 *  - body > 8 KB → 413; cross-origin → 403; > 20 events → only the first 20 are read
 *  - per-isolate soft limit per client (IP held in memory only, never stored): 240 events/min
 *  - per-session limit checked in D1: a session that already logged 120 events in the last
 *    minute has further events silently dropped (still 204, so bots learn nothing)
 */
import { type Env, hostOf, isAllowedHost, json } from "../_lib/env";

const MAX_BODY = 8 * 1024;
const MAX_BATCH = 20;
const SESSION_PER_MIN = 120;
const CLIENT_PER_MIN = 240;
const ACTIONS = new Set(["view", "start", "success", "error", "download"]);
const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

type Row = {
  session: string;
  path: string | null;
  tool: string;
  preset: string | null;
  action: string;
  in_bytes: number | null;
  out_bytes: number | null;
  count: number | null;
  duration_ms: number | null;
  error: string | null;
  referrer: string | null;
};

// In-memory, per-isolate counters. Best effort only; resets whenever the isolate recycles.
const buckets = new Map<string, { minute: number; n: number }>();

function overClientLimit(key: string, add: number): boolean {
  const minute = Math.floor(Date.now() / 60000);
  const b = buckets.get(key);
  if (!b || b.minute !== minute) {
    if (buckets.size > 5000) buckets.clear();
    buckets.set(key, { minute, n: add });
    return add > CLIENT_PER_MIN;
  }
  b.n += add;
  return b.n > CLIENT_PER_MIN;
}

function str(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.replace(/[\u0000-\u001f\u007f]/g, " ").trim();
  return s ? s.slice(0, max) : null;
}

function int(v: unknown, min: number, max: number): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.min(max, Math.max(min, Math.round(v)));
}

function slug(v: unknown): string | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  return SLUG.test(s) ? s : null;
}

/** Error text: short, and stripped of anything that looks like a file name or path. */
function cleanError(v: unknown): string | null {
  const s = str(v, 300);
  if (!s) return null;
  return s
    .replace(/[^\s"'`/\\]+\.(pdf|jpe?g|png|webp|heic|heif|gif|bmp|tiff?|docx?|txt)\b/gi, "<file>")
    .replace(/(?:[a-z]:)?[\\/][^\s"'`]*/gi, "<path>")
    .slice(0, 160);
}

function cleanPath(v: unknown): string | null {
  const s = str(v, 200);
  if (!s || !s.startsWith("/")) return null;
  return s.split(/[?#]/)[0] || "/";
}

function cleanReferrer(v: unknown): string | null {
  const s = str(v, 120);
  if (!s) return null;
  const host = s.toLowerCase().replace(/^https?:\/\//, "").split(/[/:?#]/)[0];
  return /^[a-z0-9.-]{1,100}$/.test(host) ? host : null;
}

function toRow(raw: unknown): Row | null {
  if (!raw || typeof raw !== "object") return null;
  const e = raw as Record<string, unknown>;
  const tool = slug(e.tool);
  const action = typeof e.action === "string" && ACTIONS.has(e.action) ? e.action : null;
  const session = typeof e.session === "string" && /^[A-Za-z0-9_-]{8,40}$/.test(e.session) ? e.session : null;
  if (!tool || !action || !session) return null;
  const GB = 2 * 1024 ** 3;
  return {
    session,
    path: cleanPath(e.path),
    tool,
    preset: slug(e.preset),
    action,
    in_bytes: int(e.inBytes, 0, GB),
    out_bytes: int(e.outBytes, 0, GB),
    count: int(e.count, 0, 10000),
    duration_ms: int(e.durationMs, 0, 30 * 60 * 1000),
    error: action === "error" ? cleanError(e.error) ?? "unknown" : null,
    referrer: cleanReferrer(e.referrer),
  };
}

export function deviceOf(ua: string): string {
  if (!ua) return "unknown";
  if (/bot|crawl|spider|slurp|headless|lighthouse|pagespeed/i.test(ua)) return "bot";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|ipod|android/i.test(ua)) return "mobile";
  return "desktop";
}

export function browserOf(ua: string): string {
  if (!ua) return "other";
  if (/SamsungBrowser/i.test(ua)) return "samsung";
  if (/UCBrowser|UCWEB/i.test(ua)) return "uc";
  if (/OPR\/|Opera/i.test(ua)) return "opera";
  if (/Edg\//i.test(ua)) return "edge";
  if (/FxiOS|Firefox\//i.test(ua)) return "firefox";
  if (/CriOS|Chrome\//i.test(ua)) return "chrome";
  if (/Safari\//i.test(ua)) return "safari";
  return "other";
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Same-origin only: Origin (or Referer, for older sendBeacon impls) must be one of our hosts.
  const originHost = hostOf(request.headers.get("origin")) ?? hostOf(request.headers.get("referer"));
  if (!originHost || !isAllowedHost(originHost)) return json({ error: "forbidden" }, 403);

  const declared = Number(request.headers.get("content-length") || "0");
  if (declared > MAX_BODY) return json({ error: "too large" }, 413);
  const text = await request.text();
  if (text.length > MAX_BODY) return json({ error: "too large" }, 413);

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "bad json" }, 400);
  }
  const list = (Array.isArray(body) ? body : [body]).slice(0, MAX_BATCH);
  const rows = list.map(toRow).filter((r): r is Row => r !== null);
  if (rows.length === 0) return new Response(null, { status: 204 });

  const clientKey = request.headers.get("cf-connecting-ip") || "local";
  if (overClientLimit(clientKey, rows.length)) return new Response(null, { status: 204 });

  if (!env.DB) return new Response(null, { status: 204 }); // binding missing: fail quietly

  const ua = request.headers.get("user-agent") || "";
  const device = deviceOf(ua);
  if (device === "bot") return new Response(null, { status: 204 });
  const browser = browserOf(ua);
  const cf = (request as unknown as { cf?: IncomingRequestCfProperties }).cf;
  const rawCountry = (cf?.country as string | undefined) || request.headers.get("cf-ipcountry") || "";
  const country = /^[A-Z]{2}$/.test(rawCountry) ? rawCountry : "XX";

  try {
    const now = Date.now();
    // Per-session minute cap (uses idx_events_session_ts).
    const sessions = [...new Set(rows.map((r) => r.session))];
    const blocked = new Set<string>();
    for (const s of sessions) {
      const r = await env.DB.prepare("SELECT COUNT(*) AS n FROM events WHERE session = ?1 AND ts > ?2")
        .bind(s, now - 60_000)
        .first<{ n: number }>();
      if ((r?.n ?? 0) >= SESSION_PER_MIN) blocked.add(s);
    }
    const accepted = rows.filter((r) => !blocked.has(r.session));
    if (accepted.length) {
      const stmt = env.DB.prepare(
        `INSERT INTO events (ts, session, path, tool, preset, action, in_bytes, out_bytes, count, duration_ms, error, device, browser, country, referrer)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15)`,
      );
      await env.DB.batch(
        accepted.map((r) =>
          stmt.bind(
            now,
            r.session,
            r.path,
            r.tool,
            r.preset,
            r.action,
            r.in_bytes,
            r.out_bytes,
            r.count,
            r.duration_ms,
            r.error,
            device,
            browser,
            country,
            r.referrer,
          ),
        ),
      );
    }
  } catch {
    // Tracking must never break anything for the user.
  }
  return new Response(null, { status: 204 });
};

export const onRequest: PagesFunction<Env> = async ({ request }) =>
  request.method === "OPTIONS"
    ? new Response(null, { status: 204, headers: { allow: "POST" } })
    : json({ error: "method not allowed" }, 405, { allow: "POST" });
