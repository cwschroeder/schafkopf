import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/config';
import { updateUserSettings, getUserById } from '@/lib/auth/users';
import type { UserSettings } from '@/lib/auth/types';

// GET /api/user/settings - Get current user's settings
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  const user = await getUserById(session.user.id);

  if (!user) {
    return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 });
  }

  return NextResponse.json({ settings: user.settings });
}

// PATCH /api/user/settings - Update user settings
export async function PATCH(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Validate settings fields
    const allowedFields: (keyof UserSettings)[] = [
      'voicePreference',
      'darkMode',
      'cardDesign',
      'audioVolume',
      'soundEffectsEnabled',
      'speechEnabled',
    ];

    const updates: Partial<UserSettings> = {};

    for (const field of allowedFields) {
      if (field in body) {
        // Type validation
        switch (field) {
          case 'voicePreference':
            if (body[field] === 'male' || body[field] === 'female') {
              updates[field] = body[field];
            }
            break;
          case 'darkMode':
          case 'soundEffectsEnabled':
          case 'speechEnabled':
            if (typeof body[field] === 'boolean') {
              updates[field] = body[field];
            }
            break;
          case 'cardDesign':
            if (body[field] === 'bavarian' || body[field] === 'french') {
              updates[field] = body[field];
            }
            break;
          case 'audioVolume':
            if (typeof body[field] === 'number' && body[field] >= 0 && body[field] <= 100) {
              updates[field] = Math.round(body[field]);
            }
            break;
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Keine gültigen Einstellungen' }, { status: 400 });
    }

    const updatedUser = await updateUserSettings(session.user.id, updates);

    if (!updatedUser) {
      return NextResponse.json({ error: 'Fehler beim Speichern' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      settings: updatedUser.settings
    });
  } catch (error) {
    console.error('Settings update error:', error);
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }
}
