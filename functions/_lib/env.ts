export interface Env {
  DB: D1Database;
  /** Cloudflare Pages secret guarding /api/stats. */
  ADMIN_TOKEN?: string;
}

/** Hosts allowed to POST events (exact match, or *.pages.dev previews of this project). */
const ALLOWED_HOSTS = new Set(["documently.in", "www.documently.in", "localhost", "127.0.0.1"]);

export function isAllowedHost(host: string): boolean {
  const h = host.toLowerCase();
  return ALLOWED_HOSTS.has(h) || /^([a-z0-9-]+\.)?documently\.pages\.dev$/.test(h);
}

export function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

export function json(data: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}
