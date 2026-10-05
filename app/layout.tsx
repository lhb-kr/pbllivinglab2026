import type { Metadata, Viewport } from "next";
import { Gowun_Batang } from "next/font/google";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

// 본문: Pretendard (한글 가독성) · 제목: 고운바탕 (차분한 명조 포인트)
// 한글 폰트는 글자 범위별로 파일이 수십 개로 나뉘어 있어 전부 미리 받지 않도록 preload를 끔
const serif = Gowun_Batang({ weight: "400", subsets: ["latin"], variable: "--font-serif", display: "swap", preload: false });

export const metadata: Metadata = {
  title: "나는 어떤 조치원 구름일까?",
  description: "조치원 생활환경 및 대학생 소진 경험 조사 — 5분이면 나의 구름 유형을 알 수 있어요.",
  openGraph: {
    title: "나는 어떤 조치원 구름일까?",
    description: "5분 설문으로 알아보는 나의 조치원 구름 유형",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f5fb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={serif.variable}>
      <body>{children}</body>
    </html>
  );
}
