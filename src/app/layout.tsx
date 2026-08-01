import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Calisthenics AI Trainer",
  description:
    "AI-powered calisthenics coach — real-time rep counting, form feedback, achievements & daily quests. No equipment needed.",
  icons: {
    icon: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4aa.png",
    apple:
      "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4aa.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        {/* Navbar dengan logo CDN */}
        <nav className="w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/1f4aa.png"
                alt="Calisthenics AI Trainer"
                className="h-8 w-8"
              />
              <span className="font-black text-lg tracking-tight text-white">
                Calisthenics AI
              </span>
            </a>
            <div className="flex items-center gap-4 text-sm font-medium">
              <a href="/workout" className="text-slate-300 hover:text-white transition-colors">
                Workout
              </a>
              <a href="/leaderboard" className="text-slate-300 hover:text-white transition-colors">
                Leaderboard
              </a>
              <a href="/create-workout" className="text-slate-300 hover:text-white transition-colors">
                Create
              </a>
            </div>
          </div>
        </nav>
        <div className="flex-1">{children}</div>
      </body>
    </html>
  );
}
