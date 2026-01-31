import "./globals.css";
import { MantineProvider, ColorSchemeScript } from "@mantine/core";
import { mantineTheme } from "@/lib/theme";
import type { Metadata } from 'next';

import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { Notifications } from '@mantine/notifications';

export const metadata: Metadata = {
  title: {
    default: 'HomeCoreOS',
    template: '%s | HomeCoreOS'
  },
  description: 'A personal operating system to bring rhyme and rhythm to everyday life. Grounded. Private. Yours.',
  keywords: ['productivity', 'personal os', 'task management', 'recipe organizer', 'daily notes', 'habit tracker'],
  authors: [{ name: 'HomeCoreOS' }],
  creator: 'HomeCoreOS',
  metadataBase: new URL('https://homecoreos.com'),
  openGraph: {
    title: 'HomeCoreOS',
    description: 'A personal operating system to bring rhyme and rhythm to everyday life. Grounded. Private. Yours.',
    url: 'https://homecoreos.com',
    siteName: 'HomeCoreOS',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HomeCoreOS',
    description: 'A personal operating system to bring rhyme and rhythm to everyday life. Grounded. Private. Yours.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
      </head>
      <body>
        <MantineProvider theme={mantineTheme} defaultColorScheme="dark">
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
