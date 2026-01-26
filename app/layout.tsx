import type { Metadata } from "next";
import { ColorSchemeScript, MantineProvider, AppShell, AppShellNavbar, AppShellMain } from '@mantine/core';
import { theme } from './theme';
import { Sidebar } from "./components/Sidebar";
import '@mantine/core/styles.css';
import "./globals.css";

export const metadata: Metadata = {
  title: "homecoreos",
  description: "homecoreos",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <ColorSchemeScript />
      </head>
      <body>
        <MantineProvider theme={theme}>
          <AppShell
            navbar={{ width: 80, breakpoint: 'sm' }} // Reduced width for minimalist sidebar
            padding="xl" // Increased padding
          >
            <AppShellNavbar p={0} withBorder={false} style={{ backgroundColor: 'transparent' }}>
              <Sidebar />
            </AppShellNavbar>

            <AppShellMain>
              {children}
            </AppShellMain>
          </AppShell>
        </MantineProvider>
      </body>
    </html>
  );
}