import type { Metadata, Viewport } from "next";
import { Gowun_Dodum } from "next/font/google";
import "./globals.css";

const gowun = Gowun_Dodum({ weight: "400", subsets: ["latin"], variable: "--font-gowun", display: "swap" });

export const metadata: Metadata = {
  title: "나는 어떤 조치원 구름일까?",
  description: "조치원 생활환경 및 대학생 소진 경험 조사 — 5분이면 나의 구름 유형을 알 수 있어요.",
  openGraph: {
    title: "나는 어떤 조치원 구름일까? ☁︎",
    description: "5분 설문으로 알아보는 나의 조치원 구름 유형",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#e8e0ff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={gowun.variable}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
