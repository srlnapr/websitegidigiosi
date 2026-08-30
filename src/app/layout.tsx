import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'GDG on Campus - Telkom University Purwokerto',
  description: 'Official Web Platform for Google Developer Groups (GDG) on Campus Telkom University Purwokerto. Connect, build, and grow with university developers in Purwokerto, Indonesia.',
  keywords: ['GDG', 'GDG on Campus', 'Telkom University Purwokerto', 'Google Developer Student Club', 'Purwokerto Tech Community', 'Software Engineering'],
  authors: [{ name: 'GDG Telkom Purwokerto Team' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" 
          rel="stylesheet" 
        />
      </head>
      <body className="bg-[#f9f9ff] text-[#191b22] antialiased selection:bg-[#0058bd] selection:text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
