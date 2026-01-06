import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SiteProvider } from "../contexts/SiteContext";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pulse Analytics | Customer Data Platform",
  description: "Real-time visitor tracking, audience segmentation, and customer intelligence platform. Track user behavior, build custom audiences, and drive conversions.",
  keywords: "analytics, CDP, customer data platform, visitor tracking, audience segmentation, marketing analytics",
  authors: [{ name: "Pulse Analytics" }],
  openGraph: {
    title: "Pulse Analytics | Customer Data Platform",
    description: "Real-time visitor tracking, audience segmentation, and customer intelligence platform.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SiteProvider>
          {children}
        </SiteProvider>
      </body>
    </html>
  );
}
