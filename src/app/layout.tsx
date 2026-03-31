import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import BackToTop from "@/components/BackToTop";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AppTechno Software LMS | Ultra-Premium Tech Training",
  description: "Experience the next-gen Learning Management System for AppTechno Software Institute. Bespoke training, placement support, and MNC certification.",
  keywords: "LMS, AppTechno Software, learning management, education, training",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`animate-fade-in ${inter.variable}`}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <BackToTop />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
