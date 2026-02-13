import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { getDbPool } from '@/lib/db';
import { findOrCreateUserByGoogle } from '@/lib/db-users';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      authorization: {
        params: {
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/signin',
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' && profile?.sub) {
        try {
          const pool = getDbPool();
          const appUser = await findOrCreateUserByGoogle(pool, {
            sub: profile.sub,
            email: user.email ?? profile.email,
            name: user.name ?? (profile as any).name,
            image: user.image ?? (profile as any).picture,
          });
          (user as any).id = appUser.id;
          (user as any).role = undefined;
        } catch (e) {
          console.error('findOrCreateUserByGoogle failed:', e);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id ?? user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

