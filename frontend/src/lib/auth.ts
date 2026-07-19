import { type AuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { logger } from "./logger";

const authLogger = logger.child("auth");

export type UserRole =
  | "admin"
  | "operator"
  | "security"
  | "medical"
  | "parking"
  | "staff"
  | "fan";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  stadiumId?: string;
}

export interface AuthSession extends Session {
  user: AuthUser;
  accessToken: string;
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: credentials.email,
                password: credentials.password,
              }),
            },
          );

          if (!response.ok) {
            authLogger.warn("Login failed", { email: credentials.email });
            return null;
          }

          const data = await response.json();
          return data.user as AuthUser;
        } catch (error) {
          authLogger.error("Auth provider error", { error: String(error) });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as AuthUser).role;
        token.stadiumId = (user as AuthUser).stadiumId;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          role: token.role as UserRole,
          stadiumId: token.stadiumId as string | undefined,
        },
        accessToken: token.accessToken as string,
      } as AuthSession;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  secret: process.env.AUTH_SECRET,
};

export function hasRole(user: AuthUser | undefined, allowedRoles: UserRole[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}

export function isAdmin(user: AuthUser | undefined): boolean {
  return user?.role === "admin";
}

export function isOperator(user: AuthUser | undefined): boolean {
  return user?.role === "operator";
}

