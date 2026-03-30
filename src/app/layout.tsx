import "./globals.css";
import type { ReactNode } from "react";
import { AuthProvider } from "../contexts/AuthContext"; // adjust path if no src/
import { Analytics } from "@vercel/analytics/next";

export const metadata = {
  title: "Elevance Trading",
  description: "Trading platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}