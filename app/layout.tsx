import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bittensor Affine Subnet - Dashboard & Leaderboard",
  description: "Real-time leaderboard and analytics for Bittensor Affine Subnet (SN120). Track validators, miners, stakes, and performance metrics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

