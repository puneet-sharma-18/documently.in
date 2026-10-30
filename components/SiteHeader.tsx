import Link from "next/link";
import { Logo } from "./Brand";
import MainMenu, { type MenuGroup } from "./MainMenu";
import { examPresets, presetPath, presets, tools } from "@/lib/data";

const sizeLabel: Record<string, string> = { "compress-pdf": "PDF", "compress-image": "Photo" };

// Built at render time from the registries, so a new tool or preset shows up in the menu automatically.
const groups: MenuGroup[] = [
  {
    title: "PDF tools",
    items: tools.filter((t) => t.category === "pdf").map((t) => ({ href: `/${t.slug}/`, label: t.name, icon: t.slug })),
  },
  {
    title: "Photo tools",
    items: tools.filter((t) => t.category === "image").map((t) => ({ href: `/${t.slug}/`, label: t.name, icon: t.slug })),
  },
  {
    title: "Exam photo & signature",
    items: examPresets.map((p) => ({ href: presetPath(p), label: p.chip, note: p.exam })),
  },
  {
    title: "Popular sizes",
    items: presets
      .filter((p) => p.kind === "size")
      .map((p) => ({
        href: presetPath(p),
        label: sizeLabel[p.tool] ? `${sizeLabel[p.tool]} ${p.chip.replace(/^Under/, "under")}` : p.chip,
      })),
  },
];

const links = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex items-center gap-2 text-[1.05rem] font-bold tracking-tight" aria-label="documently.in home">
          <Logo />
          <span>
            documently<span className="text-muted">.in</span>
          </span>
        </Link>
        <div className="flex items-center gap-1 md:flex-1 md:justify-between md:pl-8">
          <MainMenu groups={groups} links={links} />
          <Link
            href="/compress-pdf/"
            className="order-first inline-flex min-h-10 items-center rounded-full bg-lime px-4 text-[0.85rem] font-semibold text-ink hover:bg-brand-500 max-[359px]:hidden md:order-last"
          >
            Compress PDF
          </Link>
        </div>
      </div>
    </header>
  );
}
