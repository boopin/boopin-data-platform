import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Boopin Data Platform",
  description: "1st Party Data Collection & Analytics",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
