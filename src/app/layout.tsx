import "./globals.css";
import { MantineProvider } from "@mantine/core";
import '@mantine/core/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className="antialiased"
      >
        <MantineProvider>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
