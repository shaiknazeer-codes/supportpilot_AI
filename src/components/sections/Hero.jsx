"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Cpu,
} from "lucide-react";
import { gsap } from "gsap";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";

const HERO_BACKGROUNDS = [
  {
    id: "specialist",
    name: "Support Specialist",
    icon: "🎧",
    src: "/images/hero-bg.jpg",
    alt: "Support operations specialist actively managing customer chats and tickets with SupportPilot AI",
    badge: "Specialist Console Active",
    metric1: "99.4% Intent Accuracy",
    metric2: "1.1s Avg Resolution",
  },
  {
    id: "team",
    name: "Operations Team",
    icon: "👥",
    src: "/images/hero-bg-team.jpg",
    alt: "Customer operations team monitoring AI copilot streams on high-res monitors",
    badge: "Team Copilot Cluster",
    metric1: "1,240 msg/min Throughput",
    metric2: "Multi-Agent Synced",
  },
  {
    id: "cockpit",
    name: "Operator Cockpit",
    icon: "💻",
    src: "/images/hero-bg-solo.jpg",
    alt: "Support specialist working with ultrawide display and AI assistant",
    badge: "Ultrawide Control Center",
    metric1: "Real-time AI Assist",
    metric2: "Zero Context Switching",
  },
];

export default function Hero() {
  const [activeBg, setActiveBg] = useState(HERO_BACKGROUNDS[0]);

  // Structural Refs
  const heroContainerRef = useRef(null);
  const bgInnerRef = useRef(null);
  const scanBeamRef = useRef(null);
  const spotlightRef = useRef(null);
  const flashRef = useRef(null);

  // Mouse tilt & dynamic cursor spotlight tracking
  const handleMouseMove = useCallback((e) => {
    if (!heroContainerRef.current || !bgInnerRef.current) return;
    const rect = heroContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1

    gsap.to(bgInnerRef.current, {
      x: x * 15,
      y: y * 10,
      rotationY: x * 1.8,
      rotationX: -y * 1.8,
      duration: 1.2,
      ease: "power2.out",
    });

    if (spotlightRef.current) {
      gsap.to(spotlightRef.current, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  }, []);

  // Flash transition effect on scene switch
  const handleSceneChange = (bg) => {
    setActiveBg(bg);
    if (flashRef.current) {
      gsap.fromTo(
        flashRef.current,
        { opacity: 0.6, scale: 0.98 },
        { opacity: 0, scale: 1, duration: 0.55, ease: "power2.out" }
      );
    }
    if (bgInnerRef.current) {
      gsap.fromTo(
        bgInnerRef.current,
        { scale: 1.1, filter: "brightness(1.3) contrast(1.15)" },
        { scale: 1.03, filter: "brightness(1.12) contrast(1.08)", duration: 0.7, ease: "power3.out" }
      );
    }
  };

  // Smooth scroll to How It Works section
  const handleScrollToHowItWorks = (e) => {
    e?.preventDefault?.();
    const target =
      document.getElementById("storytelling") ||
      document.getElementById("features");
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Scanning Laser Beam across workspace
      if (scanBeamRef.current) {
        gsap.fromTo(
          scanBeamRef.current,
          { top: "-5%", opacity: 0 },
          {
            top: "105%",
            opacity: 0.95,
            duration: 3.8,
            repeat: -1,
            ease: "power1.inOut",
            repeatDelay: 1.5,
          }
        );
      }
    }, heroContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={heroContainerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full min-h-[92vh] lg:min-h-screen flex items-center justify-center overflow-hidden bg-[#07070d] perspective-[1200px] pt-24 pb-16 px-4 sm:px-6 lg:px-8"
    >
      {/* ── 1. VIBRANT, HIGH-VISIBILITY PHOTOGRAPHIC WORKSPACE BACKGROUND ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div
          ref={bgInnerRef}
          className="absolute inset-0 w-full h-full will-change-transform transform-gpu scale-[1.03]"
          style={{ filter: "brightness(1.12) contrast(1.08) saturate(1.15)" }}
        >
          <Image
            src={activeBg.src}
            alt={activeBg.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_35%] lg:object-center opacity-85 transition-opacity duration-700 ease-out"
          />

          {/* High-Tech Cyber Grid */}
          <div
            className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          {/* Scanning Laser Beam */}
          <div
            ref={scanBeamRef}
            className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-accent-cyan to-transparent blur-[1px] shadow-[0_0_24px_rgba(6,182,212,1)] pointer-events-none opacity-0"
          />
        </div>

        {/* Dynamic Interactive Cursor Spotlight Beam */}
        <div
          ref={spotlightRef}
          className="absolute -top-[250px] -left-[250px] w-[550px] h-[550px] rounded-full pointer-events-none opacity-45 mix-blend-screen transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.45) 0%, rgba(6, 182, 212, 0.25) 45%, transparent 70%)",
          }}
        />

        {/* Scene switch flash effect */}
        <div
          ref={flashRef}
          className="absolute inset-0 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet opacity-0 pointer-events-none mix-blend-screen"
        />

        {/* Bright luminous gradient illumination (leaves background visible, text crystal-clear) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 90% 65% at 50% 35%, rgba(139, 92, 246, 0.24) 0%, rgba(6, 182, 212, 0.16) 45%, transparent 75%)",
          }}
        />

        {/* Subtle vignette at the edges to blend smoothly with navbar & next section */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(7, 7, 13, 0.75) 0%, rgba(7, 7, 13, 0.2) 30%, rgba(7, 7, 13, 0.35) 70%, #07070d 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-violet/15 via-transparent to-accent-cyan/15 mix-blend-screen pointer-events-none" />
      </div>

      {/* ── 2. BRIGHT AMBIENT GLOW ORBS ── */}
      <GlowOrb color="violet" size={680} blur={160} opacity={0.32} className="top-[-120px] left-[-80px] z-[1]" />
      <GlowOrb color="cyan" size={620} blur={150} opacity={0.28} className="bottom-[-100px] right-[-80px] z-[1]" />
      <GlowOrb color="violet" size={480} blur={140} opacity={0.2} className="top-1/3 left-1/2 -translate-x-1/2 z-[1]" />

      {/* ── 4. MAIN HERO CONTENT (DIRECTLY VISIBLE ON FIRST LOAD) ── */}
      <div className="relative z-10 max-w-5xl mx-auto text-center">
        {/* Status Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-semibold tracking-wider uppercase rounded-full bg-accent-violet/20 text-accent-violet-light border border-accent-violet/40 backdrop-blur-md shadow-[0_0_24px_rgba(139,92,246,0.3)]"
        >
          <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
          AI-Powered Customer Operations Platform
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-6 drop-shadow-[0_4px_24px_rgba(0,0,0,0.8)]"
        >
          <span className="block text-white">Your AI Agent for</span>
          <span className="block gradient-text mt-1">Every Customer</span>
          <span className="block text-white mt-1">Conversation.</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-200 leading-relaxed mb-8 drop-shadow-[0_2px_12px_rgba(0,0,0,0.85)] font-normal"
        >
          From first touch to resolution — SupportPilot AI handles live chat, bookings, support tickets, and human escalations. So your team focuses on what matters most.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8"
        >
          <Button variant="primary" size="lg" href="/chat" icon={<ArrowRight className="w-4 h-4" />}>
            Try AI Assistant
          </Button>
          <Button
            variant="secondary"
            size="lg"
            href="#storytelling"
            onClick={handleScrollToHowItWorks}
          >
            See How It Works
          </Button>
        </motion.div>

        {/* Dynamic Scene Switcher Pill with GSAP Flash Ripple */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="inline-flex items-center gap-1.5 p-1 rounded-full glass-card border border-white/20 bg-black/60 backdrop-blur-md shadow-2xl"
        >
          <span className="text-[11px] font-medium text-text-muted px-2.5 hidden sm:inline-flex items-center gap-1">
            <Cpu className="w-3 h-3 text-accent-cyan" />
            Live View:
          </span>
          {HERO_BACKGROUNDS.map((bg) => {
            const isActive = activeBg.id === bg.id;
            return (
              <button
                key={bg.id}
                type="button"
                onClick={() => handleSceneChange(bg)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 cursor-pointer ${
                  isActive
                    ? "bg-accent-violet/40 text-accent-violet-light border border-accent-violet/60 shadow-[0_0_12px_rgba(139,92,246,0.4)]"
                    : "text-text-muted hover:text-text-primary hover:bg-white/10"
                }`}
              >
                <span>{bg.icon}</span>
                <span>{bg.name}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-8 text-xs sm:text-sm text-slate-300 tracking-[0.25em] uppercase font-medium drop-shadow"
        >
          Listen · Understand · Act · Resolve
        </motion.p>
      </div>
    </section>
  );
}
