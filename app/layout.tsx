import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "signal-spine-poc.luebbertevan.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const socialImage = `${origin}/og.png`;
  const description = "I build software I believe in. Software engineering and design is my superpower.";

  return {
    title: "Evan Luebbert",
    description,
    alternates: { canonical: origin },
    openGraph: {
      type: "website",
      url: origin,
      title: "Evan Luebbert",
      description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: "Evan Luebbert portfolio" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Evan Luebbert",
      description,
      images: [socialImage],
    },
  };
}

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
