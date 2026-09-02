import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stategic Agent",
  description: "에어패스 네이버 키워드광고·블로그 경쟁사 모니터링 대시보드",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
