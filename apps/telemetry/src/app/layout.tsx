import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Villa Telemetry",
  description: "Infrastructure monitoring dashboard for Villa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-cream text-ink antialiased">{children}</body>
    </html>
  );
}
