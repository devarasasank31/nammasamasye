import type { Metadata, Viewport } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "Namma Samasye - ನಮ್ಮ ಸಮಸ್ಯೆ",
  description: "An anonymous citizen assistant for everyday problems in Bengaluru. Speak your language, report your problem, track your incident.",
  manifest: "/manifest.json",
  icons: { icon: "/favicon.ico" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#e94560",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="mobile-full">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
