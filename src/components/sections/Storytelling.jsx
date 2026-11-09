"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Ear,
  Brain,
  Zap,
  CheckCircle2,
  ChevronRight,
  Cpu,
  Mouse,
  ArrowRight,
} from "lucide-react";
import GlowOrb from "@/components/ui/GlowOrb";

const steps = [
  {
    step: "01",
    label: "Listen",
    title: "Hear Every Customer",
    description:
      "SupportPilot AI captures every message, tone, and intent across all channels — chat, email, and voice — in real time.",
    stat: "99.7%",
    statLabel: "message capture rate",
    icon: Ear,
    accent: "violet",
    gradient: "from-violet-500 via-purple-500 to-indigo-600",
    glowColor: "rgba(139, 92, 246, 0.35)",
    borderGlow: "border-violet-500/40",
    features: [
      "Omnichannel Ingestion (Web, WhatsApp, Email)",
      "Real-time Audio & Text Stream Parsing",
      "Customer Sentiment & Emotion Detection",
    ],
    telemetry: {
      tag: "Live Audio & Text Bus",
      metric: "Zero Dropped Packets",
      status: "Active Ingestion",
    },
  },
  {
    step: "02",
    label: "Understand",
    title: "Context-Aware Intelligence",
    description:
      "Natural language understanding maps customer intent, sentiment, and history to deliver precise, contextual responses.",
    stat: "< 200ms",
    statLabel: "intent classification",
    icon: Brain,
    accent: "cyan",
    gradient: "from-cyan-500 via-teal-500 to-blue-600",
    glowColor: "rgba(6, 182, 212, 0.35)",
    borderGlow: "border-cyan-500/40",
    features: [
      "Vector Similarity & Multi-Turn Memory",
      "Dynamic Entity Extraction",
      "Multi-Language Intent Matching",
    ],
    telemetry: {
      tag: "Neural Semantic Engine",
      metric: "99.4% Confidence Score",
      status: "Context Mapped",
    },
  },
  {
    step: "03",
    label: "Act",
    title: "Instant Automated Action",
    description:
      "Book appointments, create tickets, update records, and process requests automatically — no human latency.",
    stat: "85%",
    statLabel: "automated resolution",
    icon: Zap,
    accent: "amber",
    gradient: "from-amber-400 via-orange-500 to-rose-500",
    glowColor: "rgba(245, 158, 11, 0.35)",
    borderGlow: "border-amber-500/40",
    features: [
      "Real MongoDB Operations Execution",
      "Slot Scheduling & Ticket Creation",
      "Immediate Escalation Routing",
    ],
    telemetry: {
      tag: "Tool Dispatch Bus",
      metric: "1.1s Avg Execution",
      status: "Database Synced",
    },
  },
  {
    step: "04",
    label: "Resolve",
    title: "Complete Resolution",
    description:
      "Every interaction reaches a satisfying conclusion — resolved autonomously or seamlessly escalated to your team.",
    stat: "4.9★",
    statLabel: "customer satisfaction",
    icon: CheckCircle2,
    accent: "emerald",
    gradient: "from-emerald-400 via-teal-500 to-green-600",
    glowColor: "rgba(16, 185, 129, 0.35)",
    borderGlow: "border-emerald-500/40",
    features: [
      "Autonomous 24/7 Problem Closing",
      "Warm Human Hand-off with Full Context",
      "Automatic Satisfaction Telemetry",
    ],
    telemetry: {
      tag: "Resolution Pipeline",
      metric: "98.9% First Contact Resolution",
      status: "Verified Closed",
    },
  },
];

export default function Storytelling() {
  const containerRef = useRef(null);

  // Framer Motion Scroll Tracking
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // 5 slides total (1 Overview + 4 Steps) => transforms horizontally from 0% to -80%
  const x = useTransform(scrollYProgress, [0, 1], ["0%", "-80%"]);

  // Click on overview card to jump to any step
  const handleJumpToSlide = (index) => {
    if (!containerRef.current) return;
    const containerTop = containerRef.current.offsetTop;
    const scrollDistance = containerRef.current.offsetHeight - window.innerHeight;
    const targetY = containerTop + (index / 4) * scrollDistance;
    window.scrollTo({
      top: targetY,
      behavior: "smooth",
    });
  };

  return (
    <section
      id="storytelling"
      ref={containerRef}
      className="relative h-[380vh] bg-[#07070d] text-white"
    >
      {/* Sticky Fullscreen Viewport */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col justify-between">
        {/* Ambient Glow Lights */}
        <div className="absolute inset-0 pointer-events-none select-none z-0">
          <GlowOrb color="violet" size={650} blur={160} opacity={0.22} className="top-[-100px] left-[-60px]" />
          <GlowOrb color="cyan" size={650} blur={160} opacity={0.2} className="bottom-[-80px] right-[-60px]" />
          {/* High-Tech Cyber Grid */}
          <div
            className="absolute inset-0 opacity-[0.14] mix-blend-overlay"
            style={{
              backgroundImage:
                "linear-gradient(rgba(139, 92, 246, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(6, 182, 212, 0.4) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
        </div>

        {/* ── TOP SECTION HEADING: Four Steps to Complete Resolution ── */}
        <header className="relative z-20 pt-8 sm:pt-10 pb-2 text-center px-4 max-w-4xl mx-auto w-full">
          <span className="text-[11px] sm:text-xs font-mono uppercase tracking-widest text-accent-cyan font-bold block mb-1.5">
            How It Works
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-md">
            Four Steps to <span className="gradient-text">Complete Resolution</span>
          </h2>
        </header>

        {/* Horizontally Scrolling Slides Container */}
        <motion.div
          style={{ x }}
          className="relative z-10 flex flex-1 w-[500vw] will-change-transform items-center pb-8"
        >
          {/* ── SLIDE 0: Overview Landing Slide ── */}
          <div className="w-screen h-full flex items-center justify-center px-4 sm:px-8 shrink-0">
            <div className="max-w-3xl mx-auto text-center flex flex-col items-center">
              {/* Description */}
              <p className="max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed mb-8">
                Every conversation follows a proven path from first contact to full resolution — powered by AI that never sleeps.
              </p>

              {/* 4 Steps Visual Flow Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full max-w-3xl mb-8">
                {steps.map((st, i) => {
                  const Icon = st.icon;
                  return (
                    <button
                      key={st.step}
                      type="button"
                      onClick={() => handleJumpToSlide(i + 1)}
                      className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-accent-violet/50 hover:bg-white/[0.07] transition-all text-left group cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-mono text-[11px] text-accent-cyan font-bold">
                          STEP {st.step}
                        </span>
                        <Icon className="w-4 h-4 text-slate-400 group-hover:text-accent-violet-light transition-colors" />
                      </div>
                      <p className="font-bold text-white text-sm group-hover:text-accent-violet-light transition-colors">
                        {st.label}
                      </p>
                      <p className="font-mono text-xs text-emerald-400 mt-1">{st.stat}</p>
                    </button>
                  );
                })}
              </div>

              {/* Scroll prompt */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent-violet/20 border border-accent-violet/30 text-accent-violet-light text-xs font-medium">
                <Mouse className="w-4 h-4 animate-bounce text-accent-cyan" />
                <span>Scroll down to slide through steps</span>
                <ArrowRight className="w-3.5 h-3.5 text-accent-cyan animate-pulse" />
              </div>
            </div>
          </div>

          {/* ── SLIDES 1 to 4: Each Individual Step ── */}
          {steps.map((stage, index) => {
            const Icon = stage.icon;
            return (
              <div
                key={stage.step}
                className="w-screen h-full flex items-center justify-center px-4 sm:px-10 lg:px-16 shrink-0"
              >
                <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Left Column: Step Details */}
                  <div className="lg:col-span-6 flex flex-col items-center lg:items-start text-center lg:text-left">
                    {/* Step pill */}
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono font-semibold tracking-wider text-accent-cyan mb-4">
                      <span className="w-2 h-2 rounded-full bg-accent-cyan animate-ping" />
                      STEP {stage.step} OF 04
                    </div>

                    {/* Step Label & Title */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stage.gradient} flex items-center justify-center shadow-lg`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                        {stage.label}
                      </h3>
                    </div>

                    <h4 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
                      {stage.title}
                    </h4>

                    <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 max-w-lg">
                      {stage.description}
                    </p>

                    {/* Feature bullets */}
                    <div className="space-y-2.5 w-full max-w-md text-left">
                      {stage.features.map((feat, fIdx) => (
                        <div
                          key={fIdx}
                          className="flex items-center gap-2.5 text-xs sm:text-sm text-slate-300 bg-white/[0.03] border border-white/5 p-2 rounded-lg"
                        >
                          <ChevronRight className="w-4 h-4 text-accent-cyan shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Hero Metric & Telemetry Glass Card */}
                  <div className="lg:col-span-6 flex justify-center">
                    <div className="relative w-full max-w-md">
                      {/* Glow Behind Card */}
                      <div
                        className="absolute inset-0 rounded-3xl blur-3xl opacity-35 transition-all duration-700"
                        style={{ background: stage.glowColor }}
                      />

                      {/* Main Glass Card */}
                      <div
                        className={`relative glass-card p-6 sm:p-8 rounded-3xl border ${stage.borderGlow} bg-black/70 backdrop-blur-2xl shadow-2xl overflow-hidden`}
                      >
                        {/* Header Badge */}
                        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
                          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Cpu className="w-3.5 h-3.5 text-accent-cyan" />
                            {stage.telemetry.tag}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {stage.telemetry.status}
                          </span>
                        </div>

                        {/* Huge Metric */}
                        <div className="text-center py-4">
                          <span className="text-5xl sm:text-6xl font-black tracking-tight gradient-text block">
                            {stage.stat}
                          </span>
                          <span className="text-sm font-semibold text-white tracking-wide mt-2 block">
                            {stage.statLabel}
                          </span>
                          <span className="text-[11px] text-slate-400 italic block mt-0.5">
                            (demo data)
                          </span>
                        </div>

                        {/* Live Telemetry Footer */}
                        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs font-mono text-slate-400">
                          <span>Live Performance:</span>
                          <span className="text-accent-cyan font-semibold">
                            {stage.telemetry.metric}
                          </span>
                        </div>

                        {/* Interactive Step Progress Dots */}
                        <div className="flex items-center justify-center gap-1.5 mt-6">
                          {[0, 1, 2, 3].map((dot) => (
                            <span
                              key={dot}
                              className={`h-1.5 rounded-full transition-all duration-300 ${
                                dot === index
                                  ? "w-8 bg-gradient-to-r from-accent-cyan to-accent-violet shadow-[0_0_8px_#06b6d4]"
                                  : "w-1.5 bg-white/20"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
