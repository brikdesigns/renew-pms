import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Renew PMS',
  description: 'Dental practice management and training platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
