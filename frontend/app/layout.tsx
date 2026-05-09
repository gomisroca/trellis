import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth";
import { OrgProvider } from "@/contexts/org";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trellis",
  description: "Multi-tenant SaaS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={geist.className}>
        <AuthProvider>
          <OrgProvider>{children}</OrgProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
