import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'TMAC ISO 9001 Tracker',
  description: 'Internal ISO 9001 implementation tracker and QMS dashboard for TMAC.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

