import Link from "next/link";
import LegalPage, { legalMetadata } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = legalMetadata({
  path: "/contact/",
  title: "Contact Documently",
  description:
    "Email hello@documently.in to report a wrong exam size limit, a tool that failed on your file, or to suggest a form we should support.",
});

export default function ContactPage() {
  return (
    <LegalPage name="Contact" path="/contact/" heading="Contact us">
      <p>
        Documently is run by one person, so email is the best way to reach us:
      </p>
      <p>
        <a href={`mailto:${site.email}`} className="text-lg font-semibold">
          {site.email}
        </a>
      </p>
      <p>We usually reply within two working days. During big exam form windows it can take a little longer.</p>

      <h2>What to include</h2>
      <h3>A size limit looks wrong</h3>
      <p>
        Send the preset page link and the official notification or portal page that shows the different requirement. We
        re-check it against the source and update the page and its “verified on” date.
      </p>
      <h3>A tool failed or gave a bad result</h3>
      <p>
        Tell us the tool, your phone or computer and browser (for example “Redmi Note 12, Chrome”), the file type and its
        rough size, and the exact error you saw.{" "}
        <strong>Please don’t attach the document itself</strong> — especially ID proofs, mark sheets or signed forms. We
        don’t need it, and it’s safer for you not to email it.
      </p>
      <h3>An exam or form we don’t cover yet</h3>
      <p>Name the exam or portal and, if you have it, a link to its notification. Requests shape what we add next.</p>

      <h2>What we can’t help with</h2>
      <p>
        We are not connected to any exam body or government department, so we can’t check your application status, change
        your submitted details or extend deadlines. For those, contact the authority’s official helpdesk listed in its
        notification. See our <Link href="/disclaimer/">disclaimer</Link>.
      </p>
    </LegalPage>
  );
}
