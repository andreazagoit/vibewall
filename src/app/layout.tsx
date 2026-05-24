import type { Metadata, Viewport } from "next";
import { Caveat, DM_Serif_Display, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const caveat = Caveat({
  variable: "--font-caveat",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  weight: ["400"],
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["500"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: {
    default: "VIBEWALL — background generator",
    template: "%s · VIBEWALL",
  },
  description:
    "Algorithmic SVG wallpaper generator — 20 pattern families, 32 curated palettes, custom colors, PNG + true vector SVG export.",
  applicationName: "VIBEWALL",
  authors: [{ name: "VIBEWALL" }],
  keywords: [
    "wallpaper generator",
    "background generator",
    "SVG patterns",
    "abstract backgrounds",
    "psychedelic patterns",
    "color palette",
    "PNG export",
    "SVG export",
  ],
  openGraph: {
    type: "website",
    title: "VIBEWALL — background generator",
    description:
      "20 pattern families, 32 palettes, PNG + vector SVG export. Generate unique wallpapers in seconds.",
    siteName: "VIBEWALL",
  },
  twitter: {
    card: "summary_large_image",
    title: "VIBEWALL — background generator",
    description:
      "20 pattern families, 32 palettes, PNG + vector SVG export.",
  },
  robots: {
    index: true,
    follow: true,
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d10",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${caveat.variable} ${dmSerif.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
