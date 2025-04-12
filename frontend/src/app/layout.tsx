import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { LocationProvider } from "../contexts/LocationContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Choices Weather App",
  description: "Get accurate, block-level weather and forecasts for your exact location",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className} suppressHydrationWarning>
        <LocationProvider>
          {children}
        </LocationProvider>
      </body>
    </html>
  );
}
