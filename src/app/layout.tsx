import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AnalyticsBootstrap } from "@/components/analytics-bootstrap";
import { BottomTabs } from "@/components/bottom-tabs";
import { MonitoringBootstrap } from "@/components/monitoring-bootstrap";
import { WebviewMode } from "@/components/webview-mode";

export const metadata: Metadata = {
  title: "Game Deal Watch",
  description: "Steam과 Epic Games Store 할인, 신작, 관심 게임을 한 화면에서 확인합니다."
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <AnalyticsBootstrap />
        <MonitoringBootstrap />
        <WebviewMode />
        <div className="page-shell">
          {children}
          <BottomTabs />
        </div>
      </body>
    </html>
  );
}
