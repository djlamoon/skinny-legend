import type { Metadata, Viewport } from "next";
import { Lobster, Manrope, Unbounded } from "next/font/google";
import "../styles/tokens.css";
import "./globals.css";

/** Script display face for the logo + key headings (chrome lettering). */
const script = Lobster({ variable: "--font-script", subsets: ["latin"], weight: "400" });
/** Wide Y2K sans for labels, buttons and numbers. */
const wide = Unbounded({ variable: "--font-wide", subsets: ["latin"], weight: ["500", "700", "800"] });
/** Clean body sans. */
const body = Manrope({ variable: "--font-body", subsets: ["latin"], weight: ["400", "500", "700", "800"] });

export const metadata: Metadata = {
  title: "Skinny Legend — snap your plate, slay your macros",
  description: "Snap a photo of your food and get calories, macros and vitamins instantly. Be the legend.",
};

export const viewport: Viewport = {
  themeColor: "#0a0608",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${script.variable} ${wide.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
