import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
