import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/ui/themes";
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
  title: "Ghost AI",
  description: "Real-time collaborative system design workspace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider
          appearance={{
            theme: dark,
            variables: {
              colorBackground: "#111114",
              colorPrimary: "#00c8d4",
              colorPrimaryForeground: "#080809",
              colorForeground: "#f0f0f4",
              colorMutedForeground: "#c0c0cc",
              colorInput: "#18181c",
              colorInputForeground: "#f0f0f4",
              colorNeutral: "#f0f0f4",
              colorBorder: "#2a2a30",
              colorDanger: "#ff4d4f",
              borderRadius: "0.75rem",
            },
            elements: {
              rootBox: { fontFamily: "var(--font-geist-sans)" },
            },
          }}
        >
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
