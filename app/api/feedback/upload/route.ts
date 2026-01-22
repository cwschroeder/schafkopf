/**
 * Screenshot Upload API
 * POST - Screenshot hochladen (FormData)
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { generateScreenshotId, saveScreenshotMetadata } from '@/lib/feedback';
import type { FeedbackScreenshot } from '@/lib/feedback/types';

// Screenshot-Verzeichnis
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'feedback');

// Maximale Dateigröße: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Erlaubte MIME-Types
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// POST /api/feedback/upload - Screenshot hochladen
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const annotations = formData.get('annotations') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'Keine Datei hochgeladen' },
        { status: 400 }
      );
    }

    // MIME-Type prüfen
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Nur PNG, JPEG und WebP erlaubt' },
        { status: 400 }
      );
    }

    // Größe prüfen
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Datei zu groß (max. 5MB)' },
        { status: 400 }
      );
    }

    // Screenshot-ID generieren
    const screenshotId = generateScreenshotId();
    const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
    const filename = `${screenshotId}.${ext}`;

    // Verzeichnis erstellen falls nicht vorhanden
    await mkdir(UPLOAD_DIR, { recursive: true });

    // Datei speichern
    const buffer = Buffer.from(await file.arrayBuffer());
    const filepath = path.join(UPLOAD_DIR, filename);
    await writeFile(filepath, buffer);

    // Metadaten in Redis speichern
    const screenshot: FeedbackScreenshot = {
      id: screenshotId,
      filename,
      mimeType: file.type,
      size: file.size,
      annotations: annotations || undefined,
      createdAt: new Date(),
    };

    await saveScreenshotMetadata(screenshot);

    console.log('[Feedback] Screenshot hochgeladen:', screenshotId);

    return NextResponse.json({
      success: true,
      screenshotId,
      filename,
      url: `/feedback/${filename}`,
    });
  } catch (error) {
    console.error('[Feedback] Screenshot-Upload Fehler:', error);
    return NextResponse.json(
      { error: 'Fehler beim Hochladen des Screenshots' },
      { status: 500 }
    );
  }
}
