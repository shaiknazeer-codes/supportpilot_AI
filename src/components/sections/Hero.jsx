"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Sparkles,
  Activity,
  Zap,
  Radio,
  ShieldCheck,
  Cpu,
  CheckCircle2,
  ChevronDown,
  Terminal,
  Mouse,
  FastForward,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
  const [scrollProgress, setScrollProgress] = useState(0);

  // Structural & GSAP Refs
  const pinContainerRef = useRef(null);
  const bgInnerRef = useRef(null);
  const scanBeamRef = useRef(null);
  const spotlightRef = useRef(null);
  const flashRef = useRef(null);

  // Layer Refs for Scroll-Driven Storytelling
  const introLayerRef = useRef(null);
  const mainContentRef = useRef(null);
  const hudNode1Ref = useRef(null);
  const hudNode2Ref = useRef(null);
  const hudNode3Ref = useRef(null);
  const scrollIndicatorRef = useRef(null);

  // Mouse tilt & dynamic cursor spotlight tracking
  const handleMouseMove = useCallback((e) => {
    if (!pinContainerRef.current || !bgInnerRef.current) return;
    const rect = pinContainerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1

    gsap.to(bgInnerRef.current, {
      x: x * 18,
      y: y * 12,
      rotationY: x * 2.2,
      rotationX: -y * 2.2,
      duration: 1.2,
      ease: "power2.out",
    });

    if (spotlightRef.current) {
      gsap.to(spotlightRef.current, {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        duration: 0.6,
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
        { opacity: 0.5, scale: 0.98 },
        { opacity: 0, scale: 1, duration: 0.65, ease: "power2.out" }
      );
    }
    if (bgInnerRef.current) {
      gsap.fromTo(
        bgInnerRef.current,
        { scale: 1.12, filter: "brightness(1.25)" },
        { scale: 1.05, filter: "brightness(1)", duration: 0.8, ease: "power3.out" }
      );
    }
  };

  // Skip straight to the revealed main page
  const handleSkipToMain = () => {
    const scrollDistance = 2200;
    window.scrollTo({
      top: scrollDistance,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      if (introLayerRef.current) introLayerRef.current.style.display = "none";
      if (mainContentRef.current) mainContentRef.current.style.opacity = "1";
      if (hudNode1Ref.current) hudNode1Ref.current.style.opacity = "1";
      if (hudNode2Ref.current) hudNode2Ref.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      // ── 1. Continuous Micro-Animations ──
      // Dynamic scanning laser beam across workspace screen
      if (scanBeamRef.current) {
        gsap.fromTo(
          scanBeamRef.current,
          { top: "-5%", opacity: 0 },
          {
            top: "105%",
            opacity: 0.9,
            duration: 4.2,
            repeat: -1,
            ease: "power1.inOut",
            repeatDelay: 1.2,
          }
        );
      }

      // Audio/Intent Neural Equalizer bars animation
      gsap.to(".hud-eq-1", { scaleY: 2.4, repeat: -1, yoyo: true, duration: 0.38, ease: "power1.inOut" });
      gsap.to(".hud-eq-2", { scaleY: 1.6, repeat: -1, yoyo: true, duration: 0.46, ease: "power1.inOut", delay: 0.1 });
      gsap.to(".hud-eq-3", { scaleY: 2.8, repeat: -1, yoyo: true, duration: 0.32, ease: "power1.inOut", delay: 0.2 });
      gsap.to(".hud-eq-4", { scaleY: 1.8, repeat: -1, yoyo: true, duration: 0.5, ease: "power1.inOut", delay: 0.15 });

      // Floating sine wave hover on HUD nodes
      if (hudNode1Ref.current) {
        gsap.to(hudNode1Ref.current, { y: "+=10", duration: 3.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
      }
      if (hudNode2Ref.current) {
        gsap.to(hudNode2Ref.current, { y: "-=12", duration: 3.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.3 });
      }

      // ── 2. Cinematic Pinned Scroll Storytelling Timeline ──
      // Pinned duration: 2200px scroll distance
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinContainerRef.current,
          start: "top top",
          end: "+=2200",
          scrub: 1,
          pin: true,
          anticipatePin: 1,
          onUpdate: (self) => {
            setScrollProgress(Math.round(self.progress * 100));
          },
        },
      });

      // [0.0 -> 0.35]: Intro Layer (System Boot & Opening Title) Dissolves
      tl.to(
        introLayerRef.current,
        {
          opacity: 0,
          y: -50,
          scale: 0.94,
          ease: "power2.inOut",
          duration: 1.2,
        },
        0
      );

      // [0.1 -> 0.7]: Background Image of Person at Desk Zooms In & Focuses
      tl.to(
        bgInnerRef.current,
        {
          scale: 1.22,
          yPercent: 6,
          filter: "brightness(1.08)",
          ease: "power1.inOut",
          duration: 2.5,
        },
        0.2
      );

      // [0.25 -> 0.75]: Floating AR HUD Telemetry Cards Slide In
      if (hudNode1Ref.current) {
        tl.fromTo(
          hudNode1Ref.current,
          { opacity: 0, x: -70, scale: 0.8 },
          { opacity: 1, x: 0, scale: 1, ease: "power2.out", duration: 1.4 },
          0.8
        );
      }

      if (hudNode2Ref.current) {
        tl.fromTo(
          hudNode2Ref.current,
          { opacity: 0, x: 70, scale: 0.8 },
          { opacity: 1, x: 0, scale: 1, ease: "power2.out", duration: 1.4 },
          1.0
        );
      }

      if (hudNode3Ref.current) {
        tl.fromTo(
          hudNode3Ref.current,
          { opacity: 0, y: -30, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, ease: "power2.out", duration: 1.2 },
          1.1
        );
      }

      // [0.45 -> 1.0]: Main Hero Content (Headlines, CTAs, Scene Switcher) Emerges
      tl.fromTo(
        mainContentRef.current,
        {
          opacity: 0,
          y: 60,
          scale: 0.94,
        },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          ease: "power3.out",
          duration: 1.8,
        },
        1.2
      );

      // Ambient glow orbs parallax
      tl.to(".hero-orb-violet", { y: 120, xPercent: -15, ease: "none", duration: 3 }, 0);
      tl.to(".hero-orb-cyan", { y: -100, xPercent: 15, ease: "none", duration: 3 }, 0);
    }, pinContainerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={pinContainerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-screen overflow-hidden bg-[#07070a] perspective-[1200px]"
    >
      {/* ── 1. DYNAMIC PHOTOGRAPHIC BACKGROUND LAYER (PERSON USING APP) ── */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
        <div
          ref={bgInnerRef}
          className="absolute inset-0 w-full h-full will-change-transform transform-gpu scale-100"
        >
          <Image
            src={activeBg.src}
            alt={activeBg.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_30%] lg:object-center opacity-50 transition-opacity duration-700 ease-out"
          />

          {/* Dynamic Laser Scanning Beam over workspace monitors */}
          <div
            ref={scanBeamRef}
            className="absolute left-0 right-0 h-2 bg-gradient-to-r from-transparent via-accent-cyan/80 to-transparent blur-[1px] shadow-[0_0_18px_rgba(6,182,212,0.9)] pointer-events-none opacity-0"
          />

          {/* High-Tech Cyber Digital Grid */}
          <div
            className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />
        </div>

        {/* Dynamic Interactive Cursor Spotlight Beam */}
        <div
          ref={spotlightRef}
          className="absolute -top-[250px] -left-[250px] w-[500px] h-[500px] rounded-full pointer-events-none opacity-30 mix-blend-screen transition-opacity duration-500"
          style={{
            background:
              "radial-gradient(circle, rgba(139, 92, 246, 0.4) 0%, rgba(6, 182, 212, 0.15) 45%, transparent 70%)",
          }}
        />

        {/* Scene switch flash layer */}
        <div
          ref={flashRef}
          className="absolute inset-0 bg-gradient-to-r from-accent-violet via-accent-cyan to-accent-violet opacity-0 pointer-events-none mix-blend-screen"
        />

        {/* Multi-layered cinematic gradient overlays for crystal-clear readability */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(9, 9, 11, 0.9) 0%, rgba(9, 9, 11, 0.46) 30%, rgba(9, 9, 11, 0.72) 75%, #07070a 100%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 90% 80% at 50% 45%, rgba(9, 9, 11, 0.45) 0%, rgba(9, 9, 11, 0.85) 68%, #07070a 100%)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-accent-violet/10 via-transparent to-accent-cyan/10 mix-blend-screen" />
      </div>

      {/* ── 2. AMBIENT GLOW ORBS & PARALLAX GRID ── */}
      <GlowOrb color="violet" size={600} blur={150} opacity={0.12} className="hero-orb-violet top-[-180px] left-[-80px] z-[1]" />
      <GlowOrb color="cyan" size={500} blur={140} opacity={0.09} className="hero-orb-cyan bottom-[-130px] right-[-80px] z-[1]" />

      {/* ── 3. FLOATING AR / HUD TELEMETRY NODES (REVEALED ON SCROLL) ── */}
      {/* Left Holographic Node: Live Copilot Stream */}
      <div
        ref={hudNode1Ref}
        className="hidden lg:flex absolute left-6 xl:left-14 top-[32%] z-[5] pointer-events-none select-none flex-col gap-2 p-3.5 rounded-2xl glass-card border border-accent-cyan/30 bg-black/45 backdrop-blur-xl shadow-[0_8px_32px_rgba(6,182,212,0.15)] max-w-[240px] opacity-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-cyan uppercase tracking-wider">
            <Radio className="w-3.5 h-3.5 animate-pulse text-accent-cyan" />
            Live Copilot Stream
          </span>
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
        </div>
        <div className="text-xs text-text-primary font-medium flex items-center justify-between">
          <span>Intent Match:</span>
          <span className="text-accent-cyan font-mono font-semibold">{activeBg.metric1}</span>
        </div>
        <div className="text-[11px] text-text-muted flex items-center justify-between font-mono">
          <span>Latency:</span>
          <span className="text-emerald-400">12ms · Realtime</span>
        </div>
        <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-0.5">
          <div className="bg-gradient-to-r from-accent-cyan to-accent-violet h-full w-[94%] rounded-full" />
        </div>
      </div>

      {/* Right Holographic Node: Active Triage */}
      <div
        ref={hudNode2Ref}
        className="hidden lg:flex absolute right-6 xl:right-14 top-[38%] z-[5] pointer-events-none select-none flex-col gap-2 p-3.5 rounded-2xl glass-card border border-accent-violet/30 bg-black/45 backdrop-blur-xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] max-w-[250px] opacity-0"
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-accent-violet-light uppercase tracking-wider">
            <Zap className="w-3.5 h-3.5 text-accent-violet-light" />
            Autonomous Action
          </span>
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">
            COMPLETED
          </span>
        </div>
        <div className="flex items-start gap-2 text-xs text-text-secondary">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>Ticket #8492 auto-triaged & resolved in 1.1s</span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-white/5 font-mono">
          <span>CSAT Rating:</span>
          <span className="text-accent-violet-light font-bold">4.9 ★★★★★</span>
        </div>
      </div>

      {/* Center-Top Floating Telemetry: Neural Waveform */}
      <div
        ref={hudNode3Ref}
        className="hidden md:flex absolute right-[20%] top-[14%] z-[5] pointer-events-none select-none items-center gap-2.5 px-3 py-1.5 rounded-full glass-card border border-white/10 bg-black/40 backdrop-blur-md shadow-lg opacity-0"
      >
        <Activity className="w-3.5 h-3.5 text-accent-cyan" />
        <span className="text-[11px] font-medium text-text-secondary">Neural Voice & Chat Bus</span>
        <div className="flex items-end gap-0.5 h-3">
          <span className="hud-eq-1 w-0.5 h-1.5 bg-accent-cyan rounded-full origin-bottom" />
          <span className="hud-eq-2 w-0.5 h-2.5 bg-accent-violet-light rounded-full origin-bottom" />
          <span className="hud-eq-3 w-0.5 h-2 bg-accent-cyan rounded-full origin-bottom" />
          <span className="hud-eq-4 w-0.5 h-3 bg-accent-violet rounded-full origin-bottom" />
        </div>
      </div>

      {/* ── 4. STAGE A: OPENING ENTRANCE ANIMATION (VISIBLE ON LOAD) ── */}
      <div
        ref={introLayerRef}
        className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 sm:px-6 pointer-events-auto text-center"
      >
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Status Beacon */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
            SYSTEM INITIALIZED // COPILOT RUNTIME ONLINE
          </div>

          {/* Grand Opening Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] mb-4 text-text-primary">
            AUTONOMOUS <span className="gradient-text">CUSTOMER OPERATIONS</span>
          </h1>

          <p className="text-sm sm:text-base md:text-lg text-text-secondary max-w-xl mb-6">
            Observe the real-time AI copilot in action. Connecting human operators with autonomous intelligence.
          </p>

          {/* Live System Terminal Logs Preview */}
          <div className="w-full max-w-lg glass-card border border-white/10 bg-black/60 p-4 rounded-xl text-left font-mono text-xs text-text-muted shadow-2xl mb-8">
            <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2 text-[11px] text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-accent-cyan" />
                runtime_stream.log
              </span>
              <span className="text-emerald-400">READY</span>
            </div>
            <div className="space-y-1 text-slate-300">
              <p className="text-emerald-400">&gt; [0.01s] Neural routing pipeline engaged...</p>
              <p className="text-accent-cyan">&gt; [0.05s] Omnichannel connectors: Web, WhatsApp, Email [OK]</p>
              <p className="text-accent-violet-light">&gt; [0.12s] Live operator console synchronized.</p>
              <p className="text-slate-400">&gt; [STATUS] Scroll down to enter workspace.</p>
            </div>
          </div>

          {/* Scroll Down Prompt Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={handleSkipToMain}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 text-accent-violet-light text-xs sm:text-sm font-medium transition-all shadow-lg hover:shadow-accent-violet/25 cursor-pointer"
            >
              <Mouse className="w-4 h-4 animate-bounce text-accent-cyan" />
              Scroll down to enter workspace
              <ChevronDown className="w-4 h-4 text-accent-cyan" />
            </button>
            <button
              type="button"
              onClick={handleSkipToMain}
              className="text-xs text-text-muted hover:text-text-primary transition-colors inline-flex items-center gap-1 pt-1 cursor-pointer"
            >
              <FastForward className="w-3 h-3" />
              Skip to main page
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. STAGE B: MAIN PAGE HERO (REVEALED AS YOU SCROLL) ── */}
      <div
        ref={mainContentRef}
        className="absolute inset-0 z-10 flex items-center justify-center pt-16 px-4 sm:px-6 lg:px-8 text-center pointer-events-auto opacity-0"
      >
        <div className="max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-medium tracking-wider uppercase rounded-full bg-accent-violet/15 text-accent-violet-light border border-accent-violet/30 backdrop-blur-md shadow-[0_0_20px_rgba(139,92,246,0.2)]">
            <Sparkles className="w-3.5 h-3.5 text-accent-cyan" />
            AI-Powered Customer Operations
          </div>

          {/* Headline */}
          <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6 drop-shadow-sm">
            <span className="block text-text-primary">Your AI Agent for</span>
            <span className="block gradient-text mt-1">Every Customer</span>
            <span className="block text-text-primary mt-1">Conversation.</span>
          </h2>

          {/* Subheadline */}
          <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-text-secondary leading-relaxed mb-8 drop-shadow-sm">
            From first touch to resolution — SupportPilot AI handles chat, bookings, tickets, and escalations. So your team focuses on what matters most.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Button variant="primary" size="lg" href="/chat" icon={<ArrowRight className="w-4 h-4" />}>
              Try AI Assistant
            </Button>
            <Button variant="secondary" size="lg" href="#features">
              See How It Works
            </Button>
          </div>

          {/* Dynamic Scene Switcher Pill with GSAP Flash Ripple */}
          <div className="inline-flex items-center gap-1.5 p-1 rounded-full glass-card border border-white/10 backdrop-blur-md shadow-2xl">
            <span className="text-[11px] font-medium text-text-muted px-2.5 hidden sm:inline flex items-center gap-1">
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
                      ? "bg-accent-violet/30 text-accent-violet-light border border-accent-violet/40 shadow-sm"
                      : "text-text-muted hover:text-text-primary hover:bg-white/5"
                  }`}
                >
                  <span>{bg.icon}</span>
                  <span>{bg.name}</span>
                </button>
              );
            })}
          </div>

          {/* Tagline */}
          <p className="mt-8 text-xs sm:text-sm text-text-muted tracking-[0.25em] uppercase font-medium">
            Listen · Understand · Act · Resolve
          </p>
        </div>
      </div>

      {/* ── 6. SCROLL PROGRESS INDICATOR DOCK ── */}
      <div
        ref={scrollIndicatorRef}
        className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 pointer-events-none flex items-center gap-3 px-3.5 py-1.5 rounded-full glass-card border border-white/10 bg-black/50 backdrop-blur-md shadow-lg"
      >
        <span className="text-[10px] font-mono tracking-wider text-text-muted uppercase">
          {scrollProgress < 25
            ? "Stage 1: System Boot"
            : scrollProgress < 75
            ? "Stage 2: Copilot Sync"
            : "Stage 3: Workspace Live"}
        </span>
        <div className="w-20 bg-white/10 h-1.5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-all duration-150 ease-out rounded-full"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        <span className="text-[10px] font-mono text-accent-cyan font-bold">{scrollProgress}%</span>
      </div>
    </div>
  );
}
