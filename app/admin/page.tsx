import type { Metadata } from "next";
import AdminClient from "./AdminClient";
import { absoluteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: "Usage dashboard | Documently admin" },
  description: "Private usage dashboard for documently.in. Anonymous tool metadata only.",
  robots: { index: false, follow: false, nocache: true },
  alternates: { canonical: absoluteUrl("/admin/") },
};

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-bold tracking-tight">Usage dashboard</h1>
      <p className="mt-1 text-sm text-muted">Anonymous metadata from /api/track. No files, names or IPs are stored.</p>
      <AdminClient />
    </main>
  );
}
