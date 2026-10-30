import Link from "next/link";
import LegalPage, { legalMetadata } from "@/components/LegalPage";
import { site } from "@/lib/site";

export const metadata = legalMetadata({
  path: "/privacy/",
  title: "Privacy Policy | Documently",
  description:
    "Your files are processed in your browser and never uploaded. What anonymous usage data Documently collects, Google Analytics and ad cookies, and retention.",
});

export default function PrivacyPage() {
  return (
    <LegalPage name="Privacy Policy" path="/privacy/" heading="Privacy Policy">
      <p>
        This policy explains what happens to your files and what information we collect when you use documently.in
        (“Documently”, “we”). The short version: <strong>your files never leave your device</strong>, and the little we do
        collect is anonymous usage information that cannot identify you.
      </p>

      <h2>1. Your files</h2>
      <p>
        Every tool on Documently — PDF compression, image compression and resizing, cropping, merging, splitting, rotating
        and converting — runs entirely inside your web browser using JavaScript and WebAssembly. The files you select are
        read and processed in your device’s memory. They are not uploaded to us or to anyone else, we never see their
        contents or file names, and nothing is stored on a server. When you close or reload the tab, the processed file is
        gone unless you downloaded it.
      </p>

      <h2>2. Anonymous usage information we collect</h2>
      <p>
        To find broken tools and understand which features people actually use, each tool page sends small usage events to
        our own endpoint (<code>/api/track</code>), hosted on Cloudflare. An event contains only:
      </p>
      <ul>
        <li>the tool and preset used (for example “compress-pdf”, “to-100kb”) and the page path;</li>
        <li>the action: page view, process started, success, error or download;</li>
        <li>the input and output file sizes in bytes, the number of pages or files, and how long processing took;</li>
        <li>for errors, a short technical error message (with anything that looks like a file name or folder removed);</li>
        <li>device type (mobile, tablet or desktop) and browser family (such as Chrome or Safari), worked out from your
          browser’s user-agent on our side — the full user-agent string is not stored;</li>
        <li>your country, as reported by Cloudflare’s network — we do not store your IP address;</li>
        <li>the website that sent you here (host name only, such as google.com);</li>
        <li>a random session ID created for each browser tab and stored in that tab’s session storage. It is not a cookie,
          disappears when you close the tab and is not linked to you.</li>
      </ul>
      <p>
        We never collect file contents, file names, your name, email, phone number or precise location through the tools.
        We use this information only to improve reliability and decide what to build next. We don’t sell it or share it
        with advertisers.
      </p>

      <h2>3. Google Analytics</h2>
      <p>
        We use Google Analytics 4 to see aggregate traffic — which pages are visited, from which countries and devices.
        Google Analytics sets first-party cookies (such as <code>_ga</code>) and receives your IP address, which Google
        uses to estimate location and does not log or store for GA4 properties. We also send the same anonymous tool events
        described above (never file names or contents). We run Google’s Consent Mode with advertising storage, ad user data
        and ad personalisation turned off by default. You can opt out of Google Analytics on all sites with Google’s{" "}
        <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener">browser add-on</a>. See{" "}
        <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">
          how Google uses data from sites that use its services
        </a>
        .
      </p>

      <h2>4. Advertising (Google AdSense)</h2>
      <p>
        To keep the tools free we plan to show ads through Google AdSense. Once ads are enabled:
      </p>
      <ul>
        <li>Google and its partners use cookies to serve ads based on your visits to this and other websites, and to
          measure ad performance. Google’s use of advertising cookies lets it and its partners serve ads to you based on
          your visits to Documently and other sites on the internet.</li>
        <li>You can turn off personalised advertising in{" "}
          <a href="https://adssettings.google.com/" rel="noopener">Google’s Ads Settings</a>, or opt out of some
          third-party vendors at <a href="https://www.aboutads.info/choices/" rel="noopener">aboutads.info</a>.</li>
        <li>If you visit from the European Economic Area, the United Kingdom or Switzerland, you will see Google’s consent
          message (a certified consent management platform) asking whether you allow cookies and personalised ads. Until
          you choose, ads are non-personalised and advertising storage stays off. You can change your choice at any time
          from the privacy link in that message.</li>
      </ul>
      <p>Ads are never placed next to upload or download buttons, and ad providers never get access to your files.</p>

      <h2>5. Hosting and security</h2>
      <p>
        The site is hosted on Cloudflare Pages. Like any web host, Cloudflare processes technical request data (including
        IP addresses) to deliver pages and protect against abuse, under its own{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">privacy policy</a>. We use HTTPS for every page.
      </p>

      <h2>6. How long we keep data</h2>
      <ul>
        <li>Anonymous usage events: deleted after <strong>13 months</strong>.</li>
        <li>Google Analytics data: retained for 14 months, Google’s shortest standard setting for GA4.</li>
        <li>Emails you send us: kept only as long as needed to answer you and handle follow-ups.</li>
        <li>Your files: never stored, so there is nothing to keep.</li>
      </ul>

      <h2>7. Your choices and rights</h2>
      <p>
        You can use every tool without an account. You can block or delete cookies in your browser settings, use the
        Google Analytics opt-out add-on, or block our usage endpoint with a content blocker — the tools keep working either
        way. Because usage events are anonymous and not linked to you, we usually cannot find or delete “your” events;
        if you think we hold personal data about you (for example, an email you sent), write to us and we will respond
        within 30 days, in line with India’s Digital Personal Data Protection Act, 2023 and, where it applies, the GDPR.
      </p>

      <h2>8. Children</h2>
      <p>
        Documently is a general-audience utility used by students of all ages. We don’t knowingly collect personal data
        from anyone, including children; the tools don’t ask for any.
      </p>

      <h2>9. Changes</h2>
      <p>
        If we change what we collect, we will update this page and the “last updated” date above before the change goes
        live.
      </p>

      <h2>10. Contact</h2>
      <p>
        Privacy questions: <a href={`mailto:${site.email}`}>{site.email}</a>. Documently is run by Puneet Sharma, Gurugram,
        Haryana, India. See also our <Link href="/terms/">Terms of Use</Link>.
      </p>
    </LegalPage>
  );
}
