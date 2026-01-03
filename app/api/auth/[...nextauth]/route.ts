/**
 * Auth.js Route Handler
 * Next.js stripped den basePath, aber Auth.js braucht ihn.
 * Wir fügen /schafkopf wieder hinzu.
 */

import { handlers } from '@/lib/auth/config';
import { NextRequest } from 'next/server';

// Hilfsfunktion: URL mit /schafkopf prefix erstellen
function addBasePath(request: NextRequest): NextRequest {
  const url = new URL(request.url);
  // /api/auth/... -> /schafkopf/api/auth/...
  url.pathname = '/schafkopf' + url.pathname;
  return new NextRequest(url, request);
}

export async function GET(request: NextRequest) {
  return handlers.GET(addBasePath(request));
}

export async function POST(request: NextRequest) {
  return handlers.POST(addBasePath(request));
}
