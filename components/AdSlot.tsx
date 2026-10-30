/**
 * Reserved-height ad container. Renders nothing visible until AdSense is enabled via
 * NEXT_PUBLIC_ADSENSE_ID, but always keeps its height so enabling ads never shifts layout.
 * Placement rule (PLAN.md §10): never next to upload or download buttons.
 */
export default function AdSlot({ slot, height = 280 }: { slot: string; height?: number }) {
  const client = process.env.NEXT_PUBLIC_ADSENSE_ID;
  if (!client) return null;
  return (
    <div className="my-8 flex items-center justify-center" style={{ minHeight: height }} data-ad-slot-name={slot}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%", minHeight: height }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
