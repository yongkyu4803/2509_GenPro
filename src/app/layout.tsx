import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import GlobalNavbar from "@/components/navigation/GlobalNavbar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "국회 보좌진 프롬프트 생성기",
  description: "전문적인 정치 콘텐츠 작성을 위한 AI 프롬프트를 생성합니다",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <GlobalNavbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
