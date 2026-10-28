import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FuturisticBackground from "@/components/ui/FuturisticBackground";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "SupportPilot AI — Your AI Agent for Every Customer Conversation",
  description:
    "AI-powered customer operations that answers questions, books appointments, creates support tickets, captures leads, and escalates to human support. Listen. Understand. Act. Resolve.",
  keywords: [
    "AI customer support",
    "customer operations",
    "AI chatbot",
    "support automation",
    "ticket management",
    "appointment booking",
  ],
  openGraph: {
    title: "SupportPilot AI — Your AI Agent for Every Customer Conversation",
    description:
      "AI-powered customer operations that listens, understands, acts, and resolves.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col relative bg-[#07070a] text-text-primary">
        <FuturisticBackground />
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}

