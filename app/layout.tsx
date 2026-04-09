import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Personal Wikipedia Companion",
  description: "A living, linked personal wiki built from your conversations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geist.className} h-screen overflow-hidden bg-gray-950 text-gray-100`}
      >
        {children}
      </body>
    </html>
  );
}
