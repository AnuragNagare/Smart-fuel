import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmartFuel - AI Nutrition Analyzer",
  description: "Analyze your meals instantly with AI. Get calories, protein, fat, and carbs from a single photo.",
  keywords: ["nutrition", "calorie counter", "AI", "food analyzer", "meal tracking"],
  authors: [{ name: "SmartFuel" }],
  openGraph: {
    title: "SmartFuel - AI Nutrition Analyzer",
    description: "Analyze your meals instantly with AI",
    type: "website",
  },
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
