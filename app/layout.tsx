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