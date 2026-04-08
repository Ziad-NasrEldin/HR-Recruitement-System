import type { NextAuthConfig, User } from "next-auth";

export const authConfig = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as User;
        token.id = u.id!;
        token.role = u.role;
        token.isActive = u.isActive;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.isActive = token.isActive;
      }
      return session;
    },
    async authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const pathname = request.nextUrl.pathname;
      const isOnLoginPage = pathname.startsWith("/en/login") || pathname.startsWith("/ar/login") || pathname.startsWith("/fr/login") || pathname === "/login";

      if (isOnLoginPage) {
        if (isLoggedIn) {
          return Response.redirect(new URL("/en/dashboard", request.nextUrl));
        }
        return true;
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
