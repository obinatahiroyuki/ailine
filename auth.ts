import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db } from "./lib/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  userRoles,
} from "./lib/db/schema";
import { ROLE_SYSTEM_ADMIN } from "./lib/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Credentials({
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;
        const email = String(credentials.email);
        const password = String(credentials.password);

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!user?.password) return null;
        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          emailVerified: user.emailVerified,
        };
      },
    }),
    Google,
    GitHub,
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (
        account?.provider !== "credentials" &&
        user?.email &&
        user?.id
      ) {
        const initialEmail = process.env.INITIAL_ADMIN_EMAIL?.toLowerCase();
        if (initialEmail && user.email.toLowerCase() === initialEmail) {
          const roles = await db
            .select({ roleId: userRoles.roleId })
            .from(userRoles)
            .where(eq(userRoles.userId, user.id));
          const hasSystemAdmin = roles.some(
            (r) => r.roleId === ROLE_SYSTEM_ADMIN
          );
          if (!hasSystemAdmin) {
            await db.insert(userRoles).values({
              userId: user.id,
              roleId: ROLE_SYSTEM_ADMIN,
            });
          }
        }
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const roleRows = await db
          .select({ roleId: userRoles.roleId })
          .from(userRoles)
          .where(eq(userRoles.userId, user.id));
        session.user.roles = roleRows.map((r) => r.roleId);
      }
      return session;
    },
    redirect({ url, baseUrl }) {
      // ログイン後のリダイレクト先を /admin に統一
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/admin`;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      // ログインページは常に許可
      if (pathname === "/admin/login") return true;
      // /admin 配下は認証必須
      if (pathname.startsWith("/admin")) {
        return !!auth?.user;
      }
      return true;
    },
  },
});
