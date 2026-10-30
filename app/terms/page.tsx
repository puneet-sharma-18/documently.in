import Link from "next/link";
import LegalPage, { legalMetadata } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = legalMetadata({
  path: "/terms/",
  title: "Terms of Use | Documently",
  description:
    "The rules for using Documently's free in-browser PDF and photo tools: your responsibilities, our limits, and why you must check output against official specs.",
});

export default function TermsPage() {
  return (
    <LegalPage name="Terms of Use" path="/terms/" heading="Terms of Use">
      <p>
        These terms apply when you use documently.in (“Documently”). By using the site you agree to them. They are written to
        be read, so they are short.
      </p>

      <h2>1. What Documently provides</h2>
      <p>
        Free tools that compress, resize, crop, convert, merge, split and rotate PDF and image files. All processing happens
        in your own browser; we don’t receive or store your files. Tools are provided free of charge, without an account,
        and may change, improve or be removed at any time.
      </p>

      <h2>2. Your files and your responsibility</h2>
      <ul>
        <li>Only process files you own or have the right to use. Don’t use the tools to alter official documents
          fraudulently, forge signatures, or misrepresent your identity.</li>
        <li>You are responsible for checking every output before you submit it — that it opens, that it is readable, and
          that it meets the current requirements of the form. Compression reduces quality; a document that is too blurry
          to read can still be rejected.</li>
        <li>Keep your original files. Documently never has a copy, so we cannot recover anything for you.</li>
      </ul>

      <h2>3. Exam and form presets</h2>
      <p>
        Preset sizes come from official notifications or portals, and each preset page shows its source and the date we
        checked it. Authorities can change their requirements without notice. The official notification always wins over
        anything on this site. Read the <Link href="/disclaimer/">disclaimer</Link> for details.
      </p>

      <h2>4. Acceptable use</h2>
      <p>
        Don’t attempt to disrupt the site, overload our usage endpoint, scrape the site at a rate that degrades it for
        others, or use it for anything unlawful under Indian law.
      </p>

      <h2>5. Open-source code</h2>
      <p>
        Documently’s source code is published under the{" "}
        <a href="https://www.gnu.org/licenses/agpl-3.0.html" rel="noopener">GNU AGPL-3.0</a>. Third-party libraries (such as
        Ghostscript, pdf.js and pdf-lib) remain under their own licences. The Documently name and logo are not covered by
        the code licence.
      </p>

      <h2>6. No warranty</h2>
      <p>
        The tools are provided “as is” and “as available”. We work hard to make them reliable, but we don’t guarantee that a
        tool will reach a particular file size, that output will be accepted by any portal, or that the site will be
        available at any given moment — for example, the night before a form deadline.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        To the extent the law allows, Documently and the person who runs it are not liable for any loss arising from use of
        the site, including a rejected application, a missed deadline, or a lost or damaged file. Because the service is
        free, our total liability for any claim is limited to ₹1,000.
      </p>

      <h2>8. Third-party links and ads</h2>
      <p>
        We link to official exam and government sites and may show ads served by Google. We don’t control those sites or
        ads and aren’t responsible for their content.
      </p>

      <h2>9. Governing law</h2>
      <p>
        These terms are governed by the laws of India. Courts in Gurugram, Haryana have jurisdiction over any dispute.
      </p>

      <h2>10. Changes and contact</h2>
      <p>
        We may update these terms; the “last updated” date above will change when we do. Questions:{" "}
        <a href={`mailto:${site.email}`}>{site.email}</a>. How we handle data is covered in the{" "}
        <Link href="/privacy/">Privacy Policy</Link>.
      </p>
    </LegalPage>
  );
}
