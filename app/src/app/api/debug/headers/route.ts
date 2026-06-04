import { headers } from "next/headers";

export async function GET() {
  const headersList = await headers();
  const allHeaders: Record<string, string> = {};

  headersList.forEach((value, key) => {
    allHeaders[key] = value;
  });

  // Simulate what detectOrigin does
  const forwardedHost = allHeaders["x-forwarded-host"] ?? allHeaders["host"];
  const protocol = allHeaders["x-forwarded-proto"];
  const isVercel = !!process.env.VERCEL;

  let detectedOrigin: string;
  if (isVercel) {
    detectedOrigin = `${protocol === "http" ? "http" : "https"}://${forwardedHost}`;
  } else {
    detectedOrigin = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  }

  return Response.json({
    detectedOrigin,
    isVercel,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ?? "NOT SET",
    computedCallbackUrl: `${detectedOrigin}/api/auth/callback/google`,
    relevantHeaders: {
      host: allHeaders["host"],
      "x-forwarded-host": allHeaders["x-forwarded-host"],
      "x-forwarded-proto": allHeaders["x-forwarded-proto"],
      "x-forwarded-for": allHeaders["x-forwarded-for"],
      "x-vercel-deployment-url": allHeaders["x-vercel-deployment-url"],
      "x-vercel-forwarded-for": allHeaders["x-vercel-forwarded-for"],
    },
    allHeaders,
  });
}
