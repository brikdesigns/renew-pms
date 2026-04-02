import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { config } from '@fortawesome/fontawesome-svg-core';
import '@fortawesome/fontawesome-svg-core/styles.css';
import './globals.css';

// Prevent FA from injecting its own <style> tag at runtime (causes FOUC)
config.autoAddCss = false;

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased theme-renew">
        <RootProvider theme={{ enabled: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
