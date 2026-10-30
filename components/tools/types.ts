import type { Preset } from "@/lib/data";

export type ToolProps = {
  tool: string;
  presetSlug?: string;
  config?: Preset["config"];
};
