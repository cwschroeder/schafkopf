import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    version: process.env.npm_package_version || '1.0.0',
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || new Date().toISOString(),
  });
}
