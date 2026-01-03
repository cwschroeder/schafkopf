'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  // basePath muss den Next.js basePath + /api/auth enthalten
  // weil Client-Requests an /schafkopf/api/auth/... gehen
  return (
    <SessionProvider basePath="/schafkopf/api/auth">
      {children}
    </SessionProvider>
  );
}
