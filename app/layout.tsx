import type { Metadata } from "next";
import "./globals.css";

const siteUrl = new URL("https://evanluebbert.com");
const description = "I build software I believe in. Software engineering and design is my superpower.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: "Evan Luebbert",
  description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: siteUrl,
    title: "Evan Luebbert",
    description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Evan Luebbert portfolio" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Evan Luebbert",
    description,
    images: ["/og.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="preload"
          href="/fonts/geist-sans-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/geist-mono-latin.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
