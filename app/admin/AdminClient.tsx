"use client";

import dynamic from "next/dynamic";

// The dashboard reads the token from localStorage, so it only ever renders in the browser.
const Dashboard = dynamic(() => import("./Dashboard"), {
  ssr: false,
  loading: () => <p className="mt-6 text-sm text-muted">Loading dashboard…</p>,
});

export default function AdminClient() {
  return <Dashboard />;
}
