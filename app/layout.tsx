/*
    Copyright (C) 2026 feldenserra

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
import type { Metadata } from "next";
import "./globals.css";
import '@mantine/core/styles.css';
import { MantineProvider, AppShell, AppShellNavbar, AppShellMain } from '@mantine/core';
import { Sidebar } from "./components/Sidebar";

export const metadata: Metadata = {
  title: "homecoreos",
  description: "homecoreos",
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <MantineProvider>
          <AppShell
            navbar={{ width: 100, breakpoint: 'sm' }}
            padding="md"
          >
            <AppShellNavbar p={0} withBorder={false}>
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