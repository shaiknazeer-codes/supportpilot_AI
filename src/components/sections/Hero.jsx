"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Hero() {
  const heroRef = useRef(null);
  const headlineRef = useRef(null);
  const subRef = useRef(null);
  const ctaRef = useRef(null);
  const badgeRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (badgeRef.current) badgeRef.current.style.opacity = "1";
      if (subRef.current) subRef.current.style.opacity = "1";
      if (ctaRef.current) ctaRef.current.style.opacity = "1";
      if (headlineRef.current) {
        Array.from(headlineRef.current.children).forEach((child) => {
          child.style.opacity = "1";
        });
      }
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        badgeRef.current,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, delay: 0.15 }
      )
        .fromTo(
          headlineRef.current?.children || [],
          { opacity: 0, y: 35 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.14 },
          "-=0.3"
        )
        .fromTo(
          subRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.4"
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6 },
          "-=0.3"
        );

      // Subtle parallax on ambient glow orbs
      gsap.to(".hero-orb-violet", {
        y: 70,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });

      gsap.to(".hero-orb-cyan", {
        y: -50,
        ease: "none",
        scrollTrigger: {
          trigger: heroRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <GlowOrb color="violet" size={600} blur={150} opacity={0.1} className="hero-orb-violet top-[-200px] left-[-100px]" />
      <GlowOrb color="cyan" size={500} blur={140} opacity={0.07} className="hero-orb-cyan bottom-[-150px] right-[-100px]" />
      <GlowOrb color="violet" size={300} blur={100} opacity={0.06} className="top-[40%] right-[10%]" />

      {/* Grid overlay */}
      <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />

      {/* Gradient fade at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none"
        style={{
          background: "linear-gradient(to top, var(--bg-primary), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Badge */}
        <div ref={badgeRef} className="opacity-0">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-8 text-xs font-medium tracking-wider uppercase rounded-full bg-accent-violet/10 text-accent-violet-light border border-accent-violet/20">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Customer Operations
          </span>
        </div>

        {/* Headline */}
        <h1
          ref={headlineRef}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          <span className="block text-text-primary">Your AI Agent for</span>
          <span className="block gradient-text mt-1">Every Customer</span>
          <span className="block text-text-primary mt-1">Conversation.</span>
        </h1>

        {/* Subheadline */}
        <p
          ref={subRef}
          className="opacity-0 max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-text-secondary leading-relaxed mb-10"
        >
          From first touch to resolution — SupportPilot AI handles chat, bookings, tickets, and escalations. So your team focuses on what matters most.
        </p>

        {/* CTA buttons */}
        <div ref={ctaRef} className="opacity-0 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" href="/chat" icon={<ArrowRight className="w-4 h-4" />}>
            Try AI Assistant
          </Button>
          <Button variant="secondary" size="lg" href="#features">
            See How It Works
          </Button>
        </div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="mt-16 text-sm text-text-muted tracking-[0.25em] uppercase font-medium"
        >
          Listen · Understand · Act · Resolve
        </motion.p>
      </div>
    </section>
  );
}
