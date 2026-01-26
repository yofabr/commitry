import type { Metadata } from "next";
import { Bitcount_Single } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const bitcount = Bitcount_Single({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Commitry",
  description: "A graph generator for commitry",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${bitcount.variable} antialiased`}
      >
        <Navbar />
        {children}
      </body>
    </html>
  );
}
