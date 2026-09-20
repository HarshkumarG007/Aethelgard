import type { Metadata, Viewport } from "next";
import { playfairDisplay, inter, caveat } from "@/lib/security/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aethelgard — Sanctuary",
  description: "A private, encrypted sanctuary for memories and milestones.",
  robots: {
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#06070a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${playfairDisplay.variable} ${inter.variable} ${caveat.variable}`}
    >
      <body className="bg-background-void text-gray-100 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
