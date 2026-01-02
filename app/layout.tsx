import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Schafkopf Online',
  description: 'Spiele Schafkopf mit Freunden oder gegen KI',
  manifest: '/schafkopf/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Schafkopf',
  },
  icons: {
    apple: '/schafkopf/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1a241e',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de" className="h-full">
      <body className="h-full min-h-dvh text-white overflow-hidden">
        {children}
      </body>
    </html>
  );
}
