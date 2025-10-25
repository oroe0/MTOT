import type { Metadata } from "next";
import { Geist, Geist_Mono, Oldenburg, Petrona } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const oldenburg = Oldenburg({
  variable: "--font-oldenburg",
  subsets: ["latin"],
  weight: "400", // Oldenburg only has regular 400
});

const petrona = Petrona({
  variable: "--font-petrona",
  subsets: ["latin"],
  weight: "400", // Oldenburg only has regular 400
});

export const metadata: Metadata = {
  title: "Mock Trial Online Trainer",
  description: "The MTOT was created to help mock trial students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${oldenburg.variable} ${petrona.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
