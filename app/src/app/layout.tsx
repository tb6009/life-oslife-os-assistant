import type { Metadata, Viewport } from "next";
import { Inter, DM_Sans } from "next/font/google";
import SessionWrapper from "@/components/SessionWrapper";
import BottomNav from "@/components/BottomNav";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Life OS",
  description: "개인 라이프 관리 앱",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-[#333333] font-body">
        <SessionWrapper>
          <div style={{ paddingBottom: "70px" }}>{children}</div>
          <BottomNav />
        </SessionWrapper>
      </body>
    </html>
  );
}
