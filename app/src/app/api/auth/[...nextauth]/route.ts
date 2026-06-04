import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

async function refreshAccessToken(token: Record<string, unknown>) {
  try {
    const response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });
    const data = await response.json();
    if (!response.ok) throw data;
    return {
      ...token,
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + data.expires_in,
      refreshToken: data.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("[NextAuth] Token refresh failed:", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: true,
  cookies: {
    csrfToken: {
      name: "__Host-next-auth.csrf-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    callbackUrl: {
      name: "__Secure-next-auth.callback-url",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
    state: {
      name: "__Secure-next-auth.state",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 900 },
    },
    pkceCodeVerifier: {
      name: "__Secure-next-auth.pkce.code_verifier",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true, maxAge: 900 },
    },
    nonce: {
      name: "__Secure-next-auth.nonce",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  pages: {
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, account }) {
      // 최초 로그인 시 토큰 저장
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        };
      }
      // 토큰이 아직 유효하면 그대로 반환
      if (typeof token.expiresAt === "number" && Date.now() / 1000 < token.expiresAt - 60) {
        return token;
      }
      // 만료됐으면 refresh
      return await refreshAccessToken(token);
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).accessToken = token.accessToken;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session as any).error = token.error;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
