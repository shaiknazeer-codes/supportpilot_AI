"use client";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import ChatPreview from "@/components/sections/ChatPreview";
import Storytelling from "@/components/sections/Storytelling";
import Features from "@/components/sections/Features";
import DashboardPreview from "@/components/sections/DashboardPreview";
import CallToAction from "@/components/sections/CallToAction";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <ChatPreview />
        <Storytelling />
        <Features />
        <DashboardPreview />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
