// Pusher Auth Endpoint für private/presence Channels

import { NextRequest, NextResponse } from 'next/server';
import { getPusherServer } from '@/lib/pusher';

export async function POST(request: NextRequest) {
  try {
    const pusher = getPusherServer();

    const formData = await request.formData();
    const socketId = formData.get('socket_id') as string;
    const channelName = formData.get('channel_name') as string;

    // User-Info aus FormData-Params (von Pusher-Client gesendet)
    const playerId = formData.get('playerId') as string || 'anonymous-' + Date.now();
    const playerName = formData.get('playerName') as string || 'Gast';

    if (channelName.startsWith('presence-')) {
      // Presence Channel - mit User-Daten
      const presenceData = {
        user_id: playerId,
        user_info: {
          name: playerName,
        },
      };

      const auth = pusher.authorizeChannel(socketId, channelName, presenceData);
      return NextResponse.json(auth);
    } else {
      // Private Channel
      const auth = pusher.authorizeChannel(socketId, channelName);
      return NextResponse.json(auth);
    }
  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 });
  }
}
