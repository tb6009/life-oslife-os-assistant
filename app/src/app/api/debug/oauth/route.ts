import { cookies, headers } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const headersList = await headers();

  const allCookies = cookieStore.getAll();
  const nextAuthCookies = allCookies.filter(c => c.name.includes("next-auth"));

  const relevantHeaders: Record<string, string | null> = {
    host: headersList.get("host"),
    "x-forwarded-host": headersList.get("x-forwarded-host"),
    "x-forwarded-proto": headersList.get("x-forwarded-proto"),
    "x-forwarded-for": headersList.get("x-forwarded-for"),
    "x-vercel-deployment-url": headersList.get("x-vercel-deployment-url"),
    referer: headersList.get("referer"),
  };

  // Check environment
  const env = {
    VERCEL: process.env.VERCEL ?? "NOT SET",
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    NODE_ENV: process.env.NODE_ENV ?? "NOT SET",
  };

  // Determine what NextAuth would compute as useSecureCookies
  const nextauthUrl = process.env.NEXTAUTH_URL ?? "";
  const isHttps = nextauthUrl.startsWith("https://");
  const expectedCookiePrefix = isHttps ? "__Secure-" : "";
  const expectedCsrfPrefix = isHttps ? "__Host-" : "";

  return Response.json({
    diagnosis: {
      isVercel: !!process.env.VERCEL,
      isHttps,
      expectedCookiePrefix,
      expectedCsrfPrefix,
      expectedCookieNames: {
        sessionToken: `${expectedCookiePrefix}next-auth.session-token`,
        callbackUrl: `${expectedCookiePrefix}next-auth.callback-url`,
        csrfToken: `${expectedCsrfPrefix}next-auth.csrf-token`,
        state: `${expectedCookiePrefix}next-auth.state`,
        pkceCodeVerifier: `${expectedCookiePrefix}next-auth.pkce.code_verifier`,
      },
    },
    cookies: nextAuthCookies.map(c => ({
      name: c.name,
      valueLength: c.value.length,
      valuePreview: c.value.substring(0, 20) + "...",
    })),
    totalCookieCount: allCookies.length,
    headers: relevantHeaders,
    env,
    timestamp: new Date().toISOString(),
  });
}
