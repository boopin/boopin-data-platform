import type { Metadata } from "next";

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
      <body style={{ margin: 0, padding: 0, background: '#0f172a', minHeight: '100vh' }}>{children}</body>
    </html>
  );
}
