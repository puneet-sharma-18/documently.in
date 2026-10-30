import Link from "next/link";
import LegalPage, { legalMetadata } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = legalMetadata({
  path: "/disclaimer/",
  title: "Disclaimer: not affiliated with any exam body",
  description:
    "Documently is independent and not affiliated with SSC, UPSC, NTA or any exam or government body. Always verify size limits with the official notification.",
});

export default function DisclaimerPage() {
  return (
    <LegalPage name="Disclaimer" path="/disclaimer/" heading="Disclaimer">
      <h2>Not affiliated with any exam authority</h2>
      <p>
        Documently is an independent website. It is <strong>not affiliated with, endorsed by or connected to</strong> any
        exam conducting body, recruitment board, university or government department — including SSC, UPSC, NTA, IBPS,
        SBI, the Railway Recruitment Boards, state public service commissions, or the Passport Seva and DigiLocker portals.
        Names of exams and authorities appear on this site only to describe which upload requirements a preset matches.
      </p>

      <h2>Always verify with the official notification</h2>
      <p>
        Every exam preset on Documently is based on an official notification or application portal, and each preset page
        links to that source and shows the date we checked it. But requirements change between exam cycles, sometimes in a
        corrigendum published after the main notification. Before you submit:
      </p>
      <ol>
        <li>Open the current official notification or the instructions on the application portal.</li>
        <li>Compare the file size range (minimum and maximum KB), pixel dimensions, file format and any rules about
          background, date on photo or signature ink with the result you downloaded from Documently.</li>
        <li>If they differ, follow the official notification and <Link href="/contact/">let us know</Link> so we can fix
          the preset.</li>
      </ol>

      <h2>No guarantee of acceptance</h2>
      <p>
        Hitting the right size doesn’t guarantee a portal will accept your photo or document. Applications are also checked
        for things a tool can’t judge: whether the photo is recent, the face is clearly visible, the signature is your
        own, and the scan is legible. Final responsibility for what you upload stays with you.
      </p>

      <h2>General information only</h2>
      <p>
        Tips and explanations on this site are general guidance, not legal or official advice. For anything about your
        eligibility, application or result, contact the authority directly.
      </p>

      <p>
        Questions: <a href={`mailto:${site.email}`}>{site.email}</a>.
      </p>
    </LegalPage>
  );
}
