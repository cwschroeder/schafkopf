/**
 * Auth.js (NextAuth v5) Konfiguration
 */

import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { RedisAdapter, getFullUserAccount } from './redis-adapter';
import type { UserAccount, UserSettings } from './types';

// Session-Erweiterung für TypeScript
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      settings: UserSettings;
    };
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: RedisAdapter(),
  trustHost: true,
  basePath: '/schafkopf/api/auth',

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
    }),
  ],

  // Session-Strategie: JWT für bessere Performance
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },

  // Seiten-Konfiguration (absolute Pfade mit basePath)
  pages: {
    signIn: '/schafkopf/login',
    error: '/schafkopf/login',
  },

  callbacks: {
    // JWT Callback: User-Daten in Token speichern
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    // Session Callback: Token-Daten in Session verfügbar machen
    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
        
        // Vollständige User-Daten laden für Settings
        const fullUser = await getFullUserAccount(token.id as string);
        if (fullUser) {
          session.user.settings = fullUser.settings;
        }
      }
      return session;
    },

    // SignIn Callback: Kann verwendet werden um Login zu erlauben/verhindern
    async signIn({ user, account, profile }) {
      // Immer erlauben
      return true;
    },

    // Redirect Callback: Basis-Path berücksichtigen
    async redirect({ url, baseUrl }) {
      const basePath = '/schafkopf';

      // Relative URLs in absolute URLs umwandeln (mit basePath)
      if (url.startsWith('/')) {
        // Wenn URL bereits mit basePath beginnt, nicht doppelt hinzufügen
        if (url.startsWith(basePath)) {
          return `${baseUrl}${url}`;
        }
        return `${baseUrl}${basePath}${url}`;
      }
      // Gleiche Origin erlauben
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return baseUrl + basePath + '/lobby';
    },
  },

  // Events für Logging/Analytics
  events: {
    async signIn({ user, isNewUser }) {
      console.log(`User signed in: ${user.email} (new: ${isNewUser})`);
    },
  },

  // Debug in Development
  debug: process.env.NODE_ENV === 'development',
});
