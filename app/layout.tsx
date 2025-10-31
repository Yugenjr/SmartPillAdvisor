"use client";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

function RootContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Redirect root to login
    if (pathname === "/") {
      router.push("/login");
    }
  }, [pathname, router]);

  return <>{children}</>;
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <title>Smart Pill Advisory - Intelligent Medication Management</title>
        <meta name="description" content="Your intelligent companion for medication management, drug interactions, and medical guidance" />
      </head>
      <body className="min-h-screen text-gray-900">
        <AuthProvider>
          <RootContent>{children}</RootContent>
        </AuthProvider>
      </body>
    </html>
  );
}
