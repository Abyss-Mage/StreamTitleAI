import type { Metadata } from "next";
import "./globals.css"; // Your corrected v3 CSS
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "StreamTitle.AI",
  description: "AI Tools for Content Creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark">
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}