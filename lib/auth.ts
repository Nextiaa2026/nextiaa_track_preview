import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      async authorize(credentials) {
        const validatedCredentials = loginSchema.parse(credentials);

        const user = await db.query.users.findFirst({
          where: eq(users.email, validatedCredentials.email),
        });

        if (!user || !user.password) {
          throw new Error("Invalid email or password");
        }

        const isPasswordCorrect = await bcrypt.compare(
          validatedCredentials.password,
          user.password,
        );

        if (!isPasswordCorrect) {
          throw new Error("Invalid email or password");
        }

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          role: user.role as "admin",
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as "admin" | "staff";
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});
