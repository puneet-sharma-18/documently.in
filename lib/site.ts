export const site = {
  name: "Documently",
  domain: "documently.in",
  url: "https://documently.in",
  tagline: "Free PDF & photo tools for every Indian form",
  description:
    "Free PDF and photo tools built for Indian exam, job and government forms. Compress, resize and convert to the exact size a form asks for — right in your browser.",
  email: "hello@documently.in",
  sourceUrl: "https://github.com/puneet-sharma-18/documently.in",
  trustLine: "Free · No signup · Files never leave your device",
};

export function absoluteUrl(path: string) {
  const clean = path === "/" ? "/" : `/${path.replace(/^\/|\/$/g, "")}/`;
  return `${site.url}${clean}`;
}
