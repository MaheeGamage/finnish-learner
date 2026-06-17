import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Fallback: full spreadsheets scope. Swap to drive.file + Google Picker
// when implementing the Sheets adapter (avoids Google app-verification).
const GOOGLE_SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/spreadsheets",
].join(" ");

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: GOOGLE_SCOPES,
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Initial sign-in: persist the tokens Google handed us.
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        return token;
      }

      // Access token still valid → use it as-is.
      if (token.expiresAt && Date.now() < token.expiresAt * 1000) {
        return token;
      }

      // Expired: silently mint a new access token from the refresh token.
      // A missing refresh token (or a failed exchange) is unrecoverable →
      // flag the session so the user is prompted to sign in again.
      if (!token.refreshToken) {
        token.error = "RefreshTokenError";
        return token;
      }

      try {
        const response = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.AUTH_GOOGLE_ID!,
            client_secret: process.env.AUTH_GOOGLE_SECRET!,
            grant_type: "refresh_token",
            refresh_token: token.refreshToken,
          }),
        });
        const refreshed = await response.json();
        if (!response.ok) throw refreshed;

        token.accessToken = refreshed.access_token;
        token.expiresAt = Math.floor(Date.now() / 1000 + refreshed.expires_in);
        // Google rotates refresh tokens only sometimes; keep the old one otherwise.
        if (refreshed.refresh_token) token.refreshToken = refreshed.refresh_token;
        delete token.error;
        return token;
      } catch {
        token.error = "RefreshTokenError";
        return token;
      }
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error;
      return session;
    },
  },
});
