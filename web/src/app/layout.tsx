import type { Metadata, Viewport } from "next";
import { Fredoka, Orbitron, Nunito } from "next/font/google";
import "./globals.css";

const display = Fredoka({ variable: "--font-display", subsets: ["latin"], weight: ["600", "700"] });
const tech = Orbitron({ variable: "--font-tech", subsets: ["latin"], weight: ["600", "800"] });
const body = Nunito({ variable: "--font-body", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Skinny Legend — snap your plate, slay your macros",
  description: "Snap a photo of your food and get calories, macros and vitamins instantly. Be the legend.",
};

export const viewport: Viewport = {
  themeColor: "#ff2e97",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${tech.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
