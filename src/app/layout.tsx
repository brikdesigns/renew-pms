import type { Metadata } from 'next';
import { RootProvider } from 'fumadocs-ui/provider/next';
import { WebVitalsReporter } from '@/components/WebVitalsReporter';
import './globals.css';

export const metadata: Metadata = {
  title: 'Renew PMS',
  description: 'Dental practice management and training platform',
};

// Synchronously applies the stored theme class before the first paint.
// Without this, server renders body with no light/dark class, browser paints
// using prefers-color-scheme, then useTheme's useEffect adds the class and
// triggers a repaint — visible as a theme flicker on every navigation.
// Must stay in sync with the storage key + class scheme used by useTheme.
const themeInitScript = `(function(){try{var t=localStorage.getItem('renew-theme-mode');if(t==='dark'){document.body.classList.add('dark');}else if(t==='light'){document.body.classList.add('light');}}catch(e){console.warn('[theme-init] could not read theme preference, falling back to OS pref:',e);}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased theme-renew" suppressHydrationWarning>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <WebVitalsReporter />
        <RootProvider theme={{ enabled: false }}>
          {children}
        </RootProvider>
      </body>
    </html>
  );
}
