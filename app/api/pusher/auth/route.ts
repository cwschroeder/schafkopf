// Socket.IO Auth Endpoint (Kompatibilitäts-Stub)
// Mit Socket.IO wird die Auth direkt im Socket-Server gehandhabt

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // Socket.IO benötigt keinen separaten Auth-Endpoint
  // Dieser Endpoint existiert nur für Abwärtskompatibilität
  return NextResponse.json({
    success: true,
    message: 'Socket.IO auth handled by socket server',
  });
}
