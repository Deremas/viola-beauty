import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // The cookie has a generous technical ceiling. The database-controlled
  // session duration below is the actual access limit.
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 366 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        username: {},
        password: {},
      },
      async authorize(credentials) {
        const usernameOrPhone = String(credentials?.username || "");
        const password = String(credentials?.password || "");
        const user = await prisma.user.findFirst({
          where: {
            deletedAt: null,
            OR: [{ username: usernameOrPhone }, { phone: usernameOrPhone }],
          },
        });

        if (!user || !user.isActive) return null;

        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.authIssuedAt = Math.floor(Date.now() / 1000);
      }

      const settings = await prisma.securitySetting.upsert({
        where: { id: "primary" },
        update: {},
        create: { id: "primary" },
        select: { sessionDurationDays: true },
      });
      const issuedAt = Number(token.authIssuedAt || token.iat || Math.floor(Date.now() / 1000));
      const authExpiresAt = issuedAt + settings.sessionDurationDays * 24 * 60 * 60;
      token.authIssuedAt = issuedAt;
      token.authExpiresAt = authExpiresAt;

      if (Math.floor(Date.now() / 1000) >= authExpiresAt) {
        delete token.id;
        delete token.role;
        token.sessionExpired = true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && !token.sessionExpired) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).sessionExpiresAt = token.authExpiresAt;
      } else if (session.user) {
        (session.user as any).id = undefined;
        (session.user as any).role = undefined;
      }
      return session;
    },
  },
});
