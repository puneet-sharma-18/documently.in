"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import ToolIcon from "./ToolIcon";

export type MenuItem = { href: string; label: string; icon?: string; note?: string };
export type MenuGroup = { title: string; items: MenuItem[]; href?: string };

/** Desktop: "All tools" opens a mega menu under the header. Mobile: a hamburger opens a right-hand drawer. */
export default function MainMenu({ groups, links }: { groups: MenuGroup[]; links: MenuItem[] }) {
  const [open, setOpen] = useState<"mega" | "drawer" | null>(null);
  const megaBtn = useRef<HTMLButtonElement>(null);
  const drawerBtn = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();

  // Close on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(null);
  }

  useEffect(() => {
    if (!open) return;
    const trigger = open === "mega" ? megaBtn.current : drawerBtn.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(null);
        trigger?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    if (open === "drawer") {
      document.body.style.overflow = "hidden";
      closeBtn.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const close = () => setOpen(null);

  return (
    <>
      {/* Desktop nav */}
      <nav aria-label="Main" className="hidden items-center gap-1 text-[0.9rem] font-medium md:flex">
        <button
          ref={megaBtn}
          type="button"
          aria-expanded={open === "mega"}
          aria-controls="mega-menu"
          onClick={() => setOpen(open === "mega" ? null : "mega")}
          className={`inline-flex min-h-10 items-center gap-1.5 rounded-full px-3.5 hover:bg-paper ${open === "mega" ? "bg-paper" : ""}`}
        >
          All tools
          <svg viewBox="0 0 16 16" className={`h-3.5 w-3.5 transition-transform ${open === "mega" ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="inline-flex min-h-10 items-center rounded-full px-3.5 hover:bg-paper">
            {l.label}
          </Link>
        ))}
      </nav>

      {/* Mobile trigger */}
      <button
        ref={drawerBtn}
        type="button"
        aria-expanded={open === "drawer"}
        aria-controls="drawer-menu"
        aria-label="Open menu"
        onClick={() => setOpen("drawer")}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper md:hidden"
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open === "mega" && (
        <>
          {createPortal(<div className="fixed inset-0 top-16 z-30 hidden bg-ink/20 md:block" onClick={close} aria-hidden />, document.body)}
          <div id="mega-menu" className="absolute inset-x-0 top-full z-40 hidden border-b border-line bg-white shadow-[0_24px_48px_-24px_rgb(15_17_18/0.25)] md:block">
            <div className="mx-auto grid max-w-6xl grid-cols-4 gap-8 px-4 py-8">
              {groups.map((g) => (
                <div key={g.title}>
                  <p className="eyebrow">{g.title}</p>
                  <ul className="mt-3 space-y-0.5">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <MenuLink item={i} onClick={close} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {open === "drawer" &&
        createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-ink/40" onClick={close} aria-hidden />
          <div
            id="drawer-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="absolute inset-y-0 right-0 flex w-[min(88vw,22rem)] flex-col bg-white shadow-2xl"
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-semibold">Menu</span>
              <button
                ref={closeBtn}
                type="button"
                aria-label="Close menu"
                onClick={() => {
                  close();
                  drawerBtn.current?.focus();
                }}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-paper"
              >
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
            <nav aria-label="All tools" className="flex-1 overflow-y-auto overscroll-contain px-3 pb-8">
              {groups.map((g) => (
                <div key={g.title} className="mt-5">
                  <p className="eyebrow px-2">{g.title}</p>
                  <ul className="mt-2">
                    {g.items.map((i) => (
                      <li key={i.href}>
                        <MenuLink item={i} onClick={close} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <ul className="mt-6 border-t border-line pt-4">
                {links.map((l) => (
                  <li key={l.href}>
                    <MenuLink item={l} onClick={close} />
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

function MenuLink({ item, onClick }: { item: MenuItem; onClick: () => void }) {
  return (
    <Link href={item.href} onClick={onClick} className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 text-[0.95rem] hover:bg-paper">
      {item.icon && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-paper text-ink">
          <ToolIcon slug={item.icon} className="h-[18px] w-[18px]" />
        </span>
      )}
      <span className="min-w-0">
        <span className="block font-medium leading-snug">{item.label}</span>
        {item.note && <span className="block truncate text-xs text-muted">{item.note}</span>}
      </span>
    </Link>
  );
}
