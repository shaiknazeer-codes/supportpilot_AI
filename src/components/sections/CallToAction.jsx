"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Button from "@/components/ui/Button";
import GlowOrb from "@/components/ui/GlowOrb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function CallToAction() {
  const sectionRef = useRef(null);
  const contentRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      gsap.set(contentRef.current, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="cta"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="section-divider mb-24" />

      {/* Background glow */}
      <GlowOrb
        color="violet"
        size={500}
        blur={160}
        opacity={0.1}
        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      />
      <GlowOrb
        color="cyan"
        size={400}
        blur={140}
        opacity={0.06}
        className="bottom-[-100px] right-[-50px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div ref={contentRef} className="opacity-0">
          <div className="glass-card gradient-border p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
            {/* Noise overlay */}
            <div className="noise-overlay" aria-hidden="true" />

            <div className="relative z-10">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-medium tracking-wider uppercase rounded-full bg-accent-violet/10 text-accent-violet-light border border-accent-violet/20">
                <Sparkles className="w-3.5 h-3.5" />
                Ready to Get Started?
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight mb-5">
                Transform Your Customer
                <br />
                <span className="gradient-text">Support Today</span>
              </h2>

              <p className="max-w-xl mx-auto text-base sm:text-lg text-text-secondary leading-relaxed mb-10">
                Join thousands of teams using SupportPilot AI to deliver faster, smarter, and more personal customer experiences.
              </p>

              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button
                  variant="primary"
                  size="lg"
                  href="/chat"
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Launch Assistant — Free Trial
                </Button>
                <Button variant="secondary" size="lg" href="#">
                  Book a Demo
                </Button>
              </div>

              {/* Trust line */}
              <p className="mt-8 text-xs text-text-muted">
                Free 14-day trial · No credit card required · Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
