import Script from "next/script";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

/**
 * GA4, loaded only when NEXT_PUBLIC_GA_ID is set. Consent Mode v2 defaults: analytics allowed,
 * all advertising storage/personalisation denied. Google's certified CMP (enabled in AdSense)
 * updates consent for EEA/UK/CH visitors once ads go live.
 */
export default function Analytics() {
  if (!GA_ID || !/^G-[A-Z0-9]{4,16}$/.test(GA_ID)) return null;
  return (
    <>
      <Script id="ga-consent" strategy="afterInteractive">
        {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;
gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
gtag('js',new Date());gtag('config','${GA_ID}');`}
      </Script>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
    </>
  );
}
