import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";

export const metadata: Metadata = {
  title: "CKA Study Tracker",
  description: "2027 CKA 합격을 위한 14주 학습 대시보드",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-theme="dark" suppressHydrationWarning>
      <body><AppShell>{children}</AppShell></body>
    </html>
  );
}
