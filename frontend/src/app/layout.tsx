import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HealthMap Ghana — AI-Powered Healthcare Access Intelligence",
  description:
    "AI-driven geospatial intelligence platform predicting healthcare-access " +
    "gaps across all districts of Ghana. Vulnerability scoring, facility " +
    "analytics, and policy recommendations for the Ghana AI Innovation Challenge.",
  keywords: [
    "Ghana", "healthcare", "AI", "GIS", "vulnerability", "machine learning",
    "policy", "WHO", "Ghana Health Service", "geospatial",
  ],
  openGraph: {
    title: "HealthMap Ghana",
    description: "AI-powered healthcare access intelligence for Ghana.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-app text-white font-sans">{children}</body>
    </html>
  );
}
