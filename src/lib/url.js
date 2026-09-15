/**
 * Helper to dynamically detect the website URL issued.
 * Ensures email confirmation and password reset links return to the
 * actual active domain (e.g. https://aichola.org, Vercel/Netlify preview, or custom domain)
 * rather than hardcoded localhost:3000.
 */
export function getAuthRedirectUrl(path = "/account") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (typeof window !== "undefined" && window.location?.origin) {
    const origin = window.location.origin.replace(/\/+$/, "");
    return `${origin}${normalizedPath}`;
  }

  const fallbackDomain =
    process.env.REACT_APP_WEBSITE_URL || "https://aichola.org";

  return `${fallbackDomain.replace(/\/+$/, "")}${normalizedPath}`;
}
