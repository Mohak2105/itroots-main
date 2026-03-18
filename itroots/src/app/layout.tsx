import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://itroots.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "ITROOTS - Transform Your Tech Career | Best IT Training Institute",
    template: "%s | ITROOTS"
  },
  description: "ITROOTS is a premier IT training institute offering industry-ready courses in Data Science, Full Stack Java, Cyber Security, AI, and more. 95% placement rate with 150+ hiring partners.",
  keywords: [
    "IT training institute",
    "data science course",
    "full stack java",
    "cyber security training",
    "software testing course",
    "data analytics",
    "artificial intelligence course",
    "IT certification",
    "job guarantee program",
    "tech career",
    "programming courses",
    "Hyderabad IT training"
  ],
  authors: [{ name: "ITROOTS" }],
  creator: "ITROOTS",
  publisher: "ITROOTS",
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    siteName: "ITROOTS",
    title: "ITROOTS - Transform Your Tech Career",
    description: "Premier IT training institute with 95% placement rate. Learn Data Science, AI, Cyber Security, and more.",
    images: [
      {
        url: "/images/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ITROOTS - IT Training Institute"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ITROOTS - Transform Your Tech Career",
    description: "Premier IT training institute with 95% placement rate.",
    images: ["/images/twitter-image.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: "google-site-verification-code",
  },
};

import MainLayout from "@/components/layout/MainLayout";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#0881ec" />
      </head>
      <body suppressHydrationWarning>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  );
}
