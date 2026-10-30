"use client";

import { useEffect, useState } from "react";

type KV = { key: string | null; n: number };
type Stats = {
  days: number;
  generatedAt: string;
  totals: { sessions: number; views: number; starts: number; successes: number; errors: number; downloads: number };
  successRate: number | null;
  tools: {
    tool: string;
    views: number;
    runs: number;
    successes: number;
    errors: number;
    downloads: number;
    avgInBytes: number | null;
    avgOutBytes: number | null;
    avgReductionPct: number | null;
    avgDurationMs: number | null;
  }[];
  presets: { tool: string; preset: string; views: number; runs: number; successes: number }[];
  daily: { day: string; views: number; runs: number; successes: number; errors: number }[];
  devices: KV[];
  countries: KV[];
  browsers: KV[];
  errors: { tool: string; error: string; count: number; lastSeen: string }[];
  referrers: KV[];
};

const TOKEN_KEY = "dly_admin_token";

function readToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}
function writeToken(v: string) {
  try {
    if (v) localStorage.setItem(TOKEN_KEY, v);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {}
}

const fmt = new Intl.NumberFormat("en-IN");
function bytes(b: number | null) {
  if (b == null) return "–";
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(2)} MB`;
}
function ms(v: number | null) {
  if (v == null) return "–";
  return v < 1000 ? `${v} ms` : `${(v / 1000).toFixed(1)} s`;
}

type Result = { key: string; data?: Stats; error?: string };

export default function Dashboard() {
  // Rendered client-only (see AdminClient.tsx), so reading localStorage in the initialiser is safe.
  const [token, setToken] = useState(readToken);
  const [draft, setDraft] = useState(token);
  const [days, setDays] = useState(7);
  const [nonce, setNonce] = useState(0);
  const [result, setResult] = useState<Result>({ key: "" });

  const key = `${token}|${days}|${nonce}`;
  const loading = Boolean(token) && result.key !== key;
  const data = token && result.key === key ? result.data ?? null : null;
  const error = token && result.key === key ? result.error ?? null : null;

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    fetch(`/api/stats?days=${days}`, { headers: { authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (res) => {
        if (res.status === 401) throw new Error("Wrong token.");
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `Request failed (${res.status}).`);
        }
        return (await res.json()) as Stats;
      })
      .then(
        (d) => !cancelled && setResult({ key, data: d }),
        (e) => !cancelled && setResult({ key, error: e instanceof Error ? e.message : "Could not load stats." }),
      );
    return () => {
      cancelled = true;
    };
  }, [token, days, key]);

  return (
    <div className="mt-6 space-y-6">
      <form
        className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-card p-4 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const v = draft.trim();
          writeToken(v);
          setToken(v);
        }}
      >
        <label className="flex-1 text-sm">
          <span className="font-medium">Admin token</span>
          <input
            type="password"
            autoComplete="off"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-1 h-11 w-full rounded-lg border border-line bg-paper px-3"
            placeholder="Paste ADMIN_TOKEN"
          />
        </label>
        <div className="flex gap-2">
          <button type="submit" className="h-11 rounded-lg bg-brand-600 px-4 font-semibold text-white hover:bg-brand-700">
            Save
          </button>
          {token && (
            <button
              type="button"
              onClick={() => {
                writeToken("");
                setToken("");
                setDraft("");
              }}
              className="h-11 rounded-lg border border-line px-4 hover:bg-brand-50"
            >
              Forget
            </button>
          )}
        </div>
        <div className="flex gap-1" role="group" aria-label="Date range">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDays(d)}
              aria-pressed={days === d}
              className={`h-11 rounded-lg px-3 text-sm font-medium ${days === d ? "bg-ink text-white" : "border border-line hover:bg-brand-50"}`}
            >
              {d}d
            </button>
          ))}
          <button type="button" onClick={() => setNonce((n) => n + 1)} className="h-11 rounded-lg border border-line px-3 text-sm hover:bg-brand-50" aria-label="Refresh">
            ↻
          </button>
        </div>
      </form>

      {!token && <p className="text-sm text-muted">Enter the token to load stats.</p>}
      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="rounded-lg border border-danger/30 bg-danger/5 p-3 text-sm text-danger">{error}</p>}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Sessions" value={fmt.format(data.totals.sessions)} />
            <Tile label="Page views" value={fmt.format(data.totals.views)} />
            <Tile label="Runs started" value={fmt.format(data.totals.starts)} />
            <Tile label="Successes" value={fmt.format(data.totals.successes)} />
            <Tile label="Errors" value={fmt.format(data.totals.errors)} tone={data.totals.errors ? "danger" : undefined} />
            <Tile label="Downloads" value={fmt.format(data.totals.downloads)} />
            <Tile label="Success rate" value={data.successRate == null ? "–" : `${data.successRate}%`} />
            <Tile label="Run → download" value={data.totals.starts ? `${Math.round((100 * data.totals.downloads) / data.totals.starts)}%` : "–"} />
          </section>

          <Card title={`Daily runs · last ${data.days} days`}>
            <DailyChart rows={data.daily} />
          </Card>

          <Card title="Tools">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    {["Tool", "Views", "Runs", "OK", "Err", "Avg in", "Avg out", "Saved", "Avg time"].map((h) => (
                      <th key={h} className="py-2 pr-3 font-medium">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.tools.map((t) => (
                    <tr key={t.tool} className="border-t border-line">
                      <td className="py-2 pr-3 font-medium">{t.tool}</td>
                      <td className="py-2 pr-3 tabular-nums">{fmt.format(t.views)}</td>
                      <td className="py-2 pr-3 tabular-nums">{fmt.format(t.runs)}</td>
                      <td className="py-2 pr-3 tabular-nums">{fmt.format(t.successes)}</td>
                      <td className={`py-2 pr-3 tabular-nums ${t.errors ? "text-danger" : ""}`}>{fmt.format(t.errors)}</td>
                      <td className="py-2 pr-3 tabular-nums">{bytes(t.avgInBytes)}</td>
                      <td className="py-2 pr-3 tabular-nums">{bytes(t.avgOutBytes)}</td>
                      <td className="py-2 pr-3 tabular-nums">{t.avgReductionPct == null ? "–" : `${t.avgReductionPct}%`}</td>
                      <td className="py-2 pr-3 tabular-nums">{ms(t.avgDurationMs)}</td>
                    </tr>
                  ))}
                  {!data.tools.length && (
                    <tr>
                      <td colSpan={9} className="py-4 text-muted">
                        No events yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            <Card title="Devices (sessions)">
              <Bars rows={data.devices} />
            </Card>
            <Card title="Countries (sessions)">
              <Bars rows={data.countries} />
            </Card>
            <Card title="Browsers (sessions)">
              <Bars rows={data.browsers} />
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card title="Top presets">
              <ol className="space-y-1 text-sm">
                {data.presets.map((p) => (
                  <li key={`${p.tool}/${p.preset}`} className="flex justify-between gap-3 border-t border-line pt-1 first:border-0">
                    <span className="truncate">
                      <span className="text-muted">{p.tool}/</span>
                      {p.preset}
                    </span>
                    <span className="shrink-0 tabular-nums text-muted">
                      {fmt.format(p.runs)} runs · {fmt.format(p.views)} views
                    </span>
                  </li>
                ))}
                {!data.presets.length && <li className="text-muted">None yet.</li>}
              </ol>
            </Card>
            <Card title="Referrers (sessions)">
              <Bars rows={data.referrers} />
            </Card>
          </div>

          <Card title="Recent errors">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="py-2 pr-3 font-medium">Tool</th>
                    <th className="py-2 pr-3 font-medium">Message</th>
                    <th className="py-2 pr-3 font-medium">Count</th>
                    <th className="py-2 pr-3 font-medium">Last seen</th>
                  </tr>
                </thead>
                <tbody>
                  {data.errors.map((e, i) => (
                    <tr key={i} className="border-t border-line align-top">
                      <td className="py-2 pr-3 font-medium">{e.tool}</td>
                      <td className="py-2 pr-3 break-words">{e.error}</td>
                      <td className="py-2 pr-3 tabular-nums">{e.count}</td>
                      <td className="py-2 pr-3 whitespace-nowrap text-muted">{new Date(e.lastSeen).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                  {!data.errors.length && (
                    <tr>
                      <td colSpan={4} className="py-4 text-muted">
                        No errors in this range.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
          <p className="text-xs text-muted">Generated {new Date(data.generatedAt).toLocaleString("en-IN")}</p>
        </>
      )}
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: "danger" }) {
  return (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold tabular-nums ${tone === "danger" ? "text-danger" : ""}`}>{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card p-4">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Bars({ rows }: { rows: KV[] }) {
  const total = rows.reduce((s, r) => s + r.n, 0);
  if (!total) return <p className="text-sm text-muted">No data.</p>;
  return (
    <ul className="space-y-2 text-sm">
      {rows.map((r) => {
        const pct = Math.round((100 * r.n) / total);
        return (
          <li key={r.key ?? "unknown"}>
            <div className="flex justify-between gap-2">
              <span className="truncate">{r.key || "unknown"}</span>
              <span className="tabular-nums text-muted">
                {fmt.format(r.n)} · {pct}%
              </span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-brand-50">
              <div className="h-2 rounded-full bg-brand-500" style={{ width: `${Math.max(pct, 2)}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function DailyChart({ rows }: { rows: Stats["daily"] }) {
  if (!rows.length) return <p className="text-sm text-muted">No data.</p>;
  const W = 640;
  const H = 180;
  const pad = { l: 32, r: 8, t: 8, b: 22 };
  const max = Math.max(1, ...rows.map((r) => Math.max(r.runs, r.successes + r.errors)));
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const slot = iw / rows.length;
  const bw = Math.max(2, Math.min(28, slot * 0.7));
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const labelEvery = Math.ceil(rows.length / 8);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Runs per day">
        {[0, 0.5, 1].map((f) => (
          <g key={f}>
            <line x1={pad.l} x2={W - pad.r} y1={y(max * f)} y2={y(max * f)} stroke="var(--color-line)" />
            <text x={pad.l - 4} y={y(max * f) + 4} textAnchor="end" fontSize="10" fill="var(--color-muted)">
              {Math.round(max * f)}
            </text>
          </g>
        ))}
        {rows.map((r, i) => {
          const x = pad.l + i * slot + (slot - bw) / 2;
          const errH = (r.errors / max) * ih;
          return (
            <g key={r.day}>
              <title>{`${r.day}: ${r.runs} runs, ${r.successes} ok, ${r.errors} errors, ${r.views} views`}</title>
              <rect x={x} y={y(r.runs)} width={bw} height={(r.runs / max) * ih} rx="2" fill="var(--color-brand-500)" />
              {r.errors > 0 && <rect x={x} y={pad.t + ih - errH} width={bw} height={errH} fill="var(--color-danger)" />}
              {i % labelEvery === 0 && (
                <text x={x + bw / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--color-muted)">
                  {r.day.slice(5)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <p className="mt-2 flex gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded-sm bg-brand-500" /> runs
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-3 rounded-sm bg-danger" /> errors
        </span>
      </p>
    </div>
  );
}
