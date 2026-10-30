"use client";

import { useEffect } from "react";
import { track } from "@/lib/track";

/** Fires a single anonymous `view` event when a tool or preset page mounts. */
export default function ViewTracker({ tool, preset }: { tool: string; preset?: string }) {
  useEffect(() => {
    track({ tool, preset, action: "view" });
  }, [tool, preset]);
  return null;
}
