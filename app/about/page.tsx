import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import LegalPage, { legalMetadata } from "@/components/LegalPage";
import { site, absoluteUrl } from "@/lib/site";

export const metadata = legalMetadata({
  path: "/about/",
  title: "About Documently: who builds it and why",
  description:
    "Who runs Documently, why we built free PDF and photo tools for Indian exam forms, how we verify upload specs and why your files never leave your device.",
});

export default function AboutPage() {
  return (
    <LegalPage name="About" path="/about/" heading="About Documently">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${site.url}/#organization`,
          name: site.name,
          url: site.url,
          logo: absoluteUrl("/icons/icon-512.png").replace(/\/$/, ""),
          email: site.email,
          description: site.description,
          areaServed: "IN",
          founder: {
            "@type": "Person",
            name: "Puneet Sharma",
            address: { "@type": "PostalAddress", addressLocality: "Gurugram", addressRegion: "Haryana", addressCountry: "IN" },
          },
          sameAs: [],
        }}
      />
      <p>
        Documently is a set of free PDF and photo tools for one very specific job: getting your documents to the exact size
        and format that an Indian exam, job or government form will accept. Compress a PDF under 100 KB, shrink a photo to
        20–50 KB, resize a signature to the pixel size a portal asks for — on your phone, in a minute, without signing up.
      </p>

      <h2>Who runs it</h2>
      <p>
        Documently is built and run by <strong>Puneet Sharma</strong>, an independent founder based in Gurugram, Haryana.
        Puneet builds India-first software for creators and direct-to-consumer brands, and writes regularly about how Indian
        consumer businesses actually work. Documently is a small, independent project — there is no large company or
        investor behind it, and no one sells your data to keep it running.
      </p>

      <h2>Why it exists</h2>
      <p>
        Almost everyone in India has lost an evening to an upload form that keeps saying “file size must be between 10 KB
        and 50 KB” or “signature dimensions invalid”. The common fixes are bad: general-purpose converters that don’t know
        what an SSC or NEET portal wants, apps full of ads that hide the download button, or cyber-café visits just to
        resize a JPEG. Documently does the narrow thing properly: it knows the target size, hits it, and tells you plainly
        if it can’t.
      </p>

      <h2>How the tools work</h2>
      <p>
        Every tool runs <strong>inside your browser</strong>. When you pick a file, your own phone or computer does the
        compressing, resizing or converting using JavaScript and WebAssembly (for example, a browser build of Ghostscript
        for PDF compression and the Canvas API for photos). Your files are never uploaded to our servers, because for these
        tools we don’t run any upload server at all. You can check this yourself: once a tool page has loaded, turn on
        aeroplane mode and it will still work.
      </p>
      <p>
        We do record a small amount of anonymous usage information — which tool ran, how big the file was before and after,
        whether it worked — so we can find and fix tools that fail. It never includes the file itself or its name. The{" "}
        <Link href="/privacy/">privacy policy</Link> lists exactly what is collected.
      </p>

      <h2>How exam presets are verified</h2>
      <p>
        Exam and form presets (for example, the photo and signature sizes for a particular recruitment exam) are only
        published when we have found the requirement in an <strong>official source</strong>: the exam notification PDF or
        the authority’s own application portal. Each preset page shows that source link and the date we last checked it
        (“verified on”). If we cannot find an official source for a size limit, we don’t publish a page for it.
      </p>
      <p>
        Authorities change their rules between cycles, so always compare our numbers with the current notification before
        you submit. If you spot a mismatch, please <Link href="/contact/">tell us</Link> — we re-check and update the page,
        including the verified-on date.
      </p>

      <h2>What we won’t do</h2>
      <ul>
        <li>Upload or keep your documents.</li>
        <li>Make you create an account or pay for basic size fixes.</li>
        <li>Claim “AI” for features that are plain image or PDF processing.</li>
        <li>Place ads next to upload or download buttons.</li>
      </ul>

      <h2>Open source</h2>
      <p>
        The code is public under the AGPL-3.0 licence at <a href={site.sourceUrl}>{site.sourceUrl.replace("https://", "")}</a>,
        so anyone can check how files are handled.
      </p>

      <h2>Contact</h2>
      <p>
        Questions, wrong specs or tool bugs: <a href={`mailto:${site.email}`}>{site.email}</a>. More options on the{" "}
        <Link href="/contact/">contact page</Link>.
      </p>
    </LegalPage>
  );
}
