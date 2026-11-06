import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-mono",
  weight: "100 900",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Portfolio · Creative Engineering & Interactive Systems",
  description: "A creative engineering and interactive graphics portfolio featuring real-time Three.js experiences.",
  metadataBase: new URL("https://example.com"),
  openGraph: {
    title: "Portfolio · Slingshot Lamp Experience",
    description: "An interactive Three.js physics experiment with dynamic lighting, pendulum motion, and real-time collision.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#050607",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="bg-bg text-text min-h-screen font-sans antialiased selection:bg-accent selection:text-bg">
        {children}
      </body>
    </html>
  );
}
