import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Internal Tools Foundation",
  description: "Synthetic internal review tools prototype",
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
