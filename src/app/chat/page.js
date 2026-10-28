import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatInterface from "@/components/chat/ChatInterface";
import GlowOrb from "@/components/ui/GlowOrb";
import { Sparkles, Shield, Cpu } from "lucide-react";

export const metadata = {
  title: "AI Assistant Panel — SupportPilot AI",
  description:
    "Interactive customer operations AI assistant panel. Ask questions, test support scenarios, and experience natural language handling powered by SupportPilot AI.",
};

export default function ChatPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden flex flex-col justify-between">
        {/* Ambient background glows */}
        <GlowOrb
          color="violet"
          size={500}
          blur={150}
          opacity={0.08}
          className="top-10 left-[-150px]"
        />
        <GlowOrb
          color="cyan"
          size={450}
          blur={140}
          opacity={0.06}
          className="bottom-10 right-[-100px]"
        />

        <div className="max-w-6xl mx-auto w-full mb-8 text-center pt-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-accent-violet/10 border border-accent-violet/20 text-accent-violet-light text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Live Assistant Environment
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-text-primary mb-2">
            SupportPilot <span className="gradient-text">Operations Agent</span>
          </h1>
          <p className="text-sm sm:text-base text-text-secondary max-w-xl mx-auto">
            Test and converse with SupportPilot AI in real-time. Secure server-side processing with zero client-side credential exposure.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 text-xs text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-accent-cyan" /> Secure Server-Side Route
            </span>
            <span className="hidden sm:inline">·</span>
            <span className="inline-flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-accent-violet-light" /> Configurable OpenAI Models
            </span>
          </div>
        </div>

        {/* Dedicated Chat Panel */}
        <div className="w-full flex justify-center mb-12">
          <ChatInterface />
        </div>
      </main>
      <Footer />
    </>
  );
}
