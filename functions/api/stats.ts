/**
 * GET /api/stats?days=7 — aggregated usage for the admin dashboard.
 * Requires `Authorization: Bearer <ADMIN_TOKEN>` (Cloudflare Pages secret).
 */
import { type Env, json } from "../_lib/env";

async function sha256(s: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)));
}

/** Constant-time compare (hash both sides first so length differences don't leak). */
async function tokenMatches(given: string, expected: string): Promise<boolean> {
  const [a, b] = await Promise.all([sha256(given), sha256(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
const round = (v: number, d = 1) => Math.round(v * 10 ** d) / 10 ** d;

async function handle(request: Request, env: Env): Promise<Response> {
  const expected = env.ADMIN_TOKEN;
  if (!expected || expected.length < 16) return json({ error: "ADMIN_TOKEN not configured (min 16 chars)" }, 503);
  const auth = request.headers.get("authorization") || "";
  const given = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!given || !(await tokenMatches(given, expected))) {
    return json({ error: "unauthorized" }, 401, { "www-authenticate": "Bearer" });
  }
  if (!env.DB) return json({ error: "D1 binding DB missing" }, 503);

  const url = new URL(request.url);
  const daysRaw = parseInt(url.searchParams.get("days") || "7", 10);
  const days = Math.min(90, Math.max(1, Number.isFinite(daysRaw) ? daysRaw : 7));
  const since = Date.now() - days * 86_400_000;
  const db = env.DB;
  const q = (sql: string) => db.prepare(sql).bind(since);

  const [totals, perTool, perPreset, daily, device, country, browser, errors, referrers] = await db.batch([
    q(`SELECT action, COUNT(*) AS n FROM events WHERE ts >= ?1 GROUP BY action`),
    q(`SELECT tool,
         SUM(action = 'view') AS views,
         SUM(action = 'start') AS runs,
         SUM(action = 'success') AS successes,
         SUM(action = 'error') AS errors,
         SUM(action = 'download') AS downloads,
         AVG(CASE WHEN action = 'success' THEN in_bytes END) AS avg_in,
         AVG(CASE WHEN action = 'success' THEN out_bytes END) AS avg_out,
         AVG(CASE WHEN action = 'success' AND in_bytes > 0 AND out_bytes IS NOT NULL
                  THEN 100.0 * (in_bytes - out_bytes) / in_bytes END) AS avg_reduction,
         AVG(CASE WHEN action = 'success' THEN duration_ms END) AS avg_duration
       FROM events WHERE ts >= ?1 GROUP BY tool ORDER BY runs DESC, views DESC`),
    q(`SELECT tool, preset,
         SUM(action = 'view') AS views, SUM(action = 'start') AS runs, SUM(action = 'success') AS successes
       FROM events WHERE ts >= ?1 AND preset IS NOT NULL
       GROUP BY tool, preset ORDER BY runs DESC, views DESC LIMIT 20`),
    q(`SELECT date(ts / 1000, 'unixepoch') AS day,
         SUM(action = 'view') AS views, SUM(action = 'start') AS runs,
         SUM(action = 'success') AS successes, SUM(action = 'error') AS errors
       FROM events WHERE ts >= ?1 GROUP BY day ORDER BY day`),
    q(`SELECT device AS key, COUNT(DISTINCT session) AS n FROM events WHERE ts >= ?1 GROUP BY device ORDER BY n DESC`),
    q(`SELECT country AS key, COUNT(DISTINCT session) AS n FROM events WHERE ts >= ?1 GROUP BY country ORDER BY n DESC LIMIT 10`),
    q(`SELECT browser AS key, COUNT(DISTINCT session) AS n FROM events WHERE ts >= ?1 GROUP BY browser ORDER BY n DESC`),
    q(`SELECT tool, error, COUNT(*) AS n, MAX(ts) AS last_ts FROM events
       WHERE ts >= ?1 AND action = 'error' GROUP BY tool, error ORDER BY last_ts DESC LIMIT 20`),
    q(`SELECT referrer AS key, COUNT(DISTINCT session) AS n FROM events
       WHERE ts >= ?1 AND referrer IS NOT NULL AND referrer NOT LIKE '%documently.in'
       GROUP BY referrer ORDER BY n DESC LIMIT 10`),
  ]);

  const t: Record<string, number> = { view: 0, start: 0, success: 0, error: 0, download: 0 };
  for (const r of totals.results as { action: string; n: number }[]) t[r.action] = n(r.n);
  const sessions = await db
    .prepare(`SELECT COUNT(DISTINCT session) AS n FROM events WHERE ts >= ?1`)
    .bind(since)
    .first<{ n: number }>();

  const finished = t.success + t.error;
  return json({
    days,
    since: new Date(since).toISOString(),
    generatedAt: new Date().toISOString(),
    totals: {
      sessions: n(sessions?.n),
      views: t.view,
      starts: t.start,
      successes: t.success,
      errors: t.error,
      downloads: t.download,
    },
    successRate: finished ? round((100 * t.success) / finished) : null,
    tools: (perTool.results as Record<string, unknown>[]).map((r) => ({
      tool: r.tool as string,
      views: n(r.views),
      runs: n(r.runs),
      successes: n(r.successes),
      errors: n(r.errors),
      downloads: n(r.downloads),
      avgInBytes: r.avg_in == null ? null : Math.round(n(r.avg_in)),
      avgOutBytes: r.avg_out == null ? null : Math.round(n(r.avg_out)),
      avgReductionPct: r.avg_reduction == null ? null : round(n(r.avg_reduction)),
      avgDurationMs: r.avg_duration == null ? null : Math.round(n(r.avg_duration)),
    })),
    presets: (perPreset.results as Record<string, unknown>[]).map((r) => ({
      tool: r.tool as string,
      preset: r.preset as string,
      views: n(r.views),
      runs: n(r.runs),
      successes: n(r.successes),
    })),
    daily: (daily.results as Record<string, unknown>[]).map((r) => ({
      day: r.day as string,
      views: n(r.views),
      runs: n(r.runs),
      successes: n(r.successes),
      errors: n(r.errors),
    })),
    devices: device.results as { key: string; n: number }[],
    countries: country.results as { key: string; n: number }[],
    browsers: browser.results as { key: string; n: number }[],
    errors: (errors.results as Record<string, unknown>[]).map((r) => ({
      tool: r.tool as string,
      error: r.error as string,
      count: n(r.n),
      lastSeen: new Date(n(r.last_ts)).toISOString(),
    })),
    referrers: referrers.results as { key: string; n: number }[],
  });
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  try {
    return await handle(request, env);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json({ error: `stats query failed: ${msg.slice(0, 200)}` }, 500);
  }
};

export const onRequest: PagesFunction<Env> = async () => json({ error: "method not allowed" }, 405, { allow: "GET" });
