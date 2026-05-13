import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role?: "admin" | "staff" | "customer" }).role || "customer";
      }
      if (trigger === "update" && session?.name) {
        token.name = session.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as "admin" | "staff" | "customer";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
