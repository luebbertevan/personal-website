import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, permanentRedirect } from "next/navigation";
import { PortfolioPage } from "../../portfolio-page";
import {
  destinations,
  getPortfolioPath,
  getPortfolioTitle,
  resolvePortfolioRoute,
} from "../../portfolio-routes";

type ProjectRoutePageProps = {
  params: Promise<{
    project: string;
    chapter?: string[];
  }>;
};

async function getRequestOrigin() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "evan-luebbert.luebbertevan.chatgpt.site";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}

export async function generateMetadata({ params }: ProjectRoutePageProps): Promise<Metadata> {
  const { project, chapter = [] } = await params;
  const route = resolvePortfolioRoute(project, chapter);
  if (!route) return {};

  const destination = destinations[route.destination];
  const title = getPortfolioTitle(route);
  const origin = await getRequestOrigin();
  const canonicalUrl = `${origin}${getPortfolioPath(route)}`;
  const socialImage = `${origin}/og.png`;

  return {
    title,
    description: destination.description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      url: canonicalUrl,
      title,
      description: destination.description,
      images: [{ url: socialImage, width: 1200, height: 630, alt: `${destination.title} — Evan Luebbert portfolio` }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: destination.description,
      images: [socialImage],
    },
  };
}

export default async function ProjectRoutePage({ params }: ProjectRoutePageProps) {
  const { project, chapter = [] } = await params;
  const route = resolvePortfolioRoute(project, chapter);
  if (!route) notFound();

  if (route.chapter === 0 && chapter.length > 0) {
    permanentRedirect(getPortfolioPath(route));
  }

  return <PortfolioPage initialRoute={route} />;
}
