import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "AccessDesk — Environment & Account Manager",
  description:
    "One place. Every environment. AccessDesk is an internal engineering platform for managing healthcare insurance platform environments, Consumer and Worker portals, and secure test account credentials.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full bg-slate-50">
      <body className="h-full overflow-hidden text-slate-900 antialiased font-sans">
        <AuthProvider>
          <ToastProvider>
            <AppShell>{children}</AppShell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
