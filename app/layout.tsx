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
import Sidebar from "./components/Sidebar";
import { ToastProvider, useToast } from './components/ToastProvider'
import { CoreItem } from './components/CoreItem';
import { revalidatePath } from "next/cache";

export const metadata: Metadata = {
  title: "homecoreos",
  description: "homecoreos",
};

let tabHeader = "Task Manager";

export async function SetTabHeader(title: string) {
  tabHeader = title;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="abyss">
      <body className="flex h-screen bg-base-200 text-base-content font-sans overflow-hidden">

        <Sidebar />
        <main className="flex-1 flex flex-col h-full overflow-y-auto relative">

          {/* HEADER */}
          <CoreItem fixed>
            <div className="navbar bg-base-100 shadow-sm z-10">
              <div className="flex-1">
                <a className="btn btn-ghost text-xl font-bold text-primary">{tabHeader}</a>
              </div>
              <div className="flex-none">
              </div>
            </div>
          </CoreItem>

          <ToastProvider>
            {children}
          </ToastProvider>
        </main>
      </body>
    </html>
  );
}