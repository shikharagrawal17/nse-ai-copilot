import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DalalDesk | NSE Live Market & Bhavcopy Terminal",
  description: "Indian equity research terminal connected to official National Stock Exchange of India Capital Market and Bhavcopy MCP feeds.",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body>{children}</body>
    </html>
  );
}
