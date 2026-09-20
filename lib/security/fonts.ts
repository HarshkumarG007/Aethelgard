import { Playfair_Display, Inter, Caveat } from "next/font/google";

/**
 * Self-hosted fonts via Next.js Font Optimization.
 * Next.js automatically downloads these font files at build time and hosts them
 * alongside the static application assets.
 * 
 * ZERO runtime requests are made to fonts.googleapis.com or fonts.gstatic.com,
 * keeping the Content Security Policy strict (font-src 'self') and preserving visitor privacy.
 */

export const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600"],
});

export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  display: "swap",
  weight: ["400", "600", "700"],
});
