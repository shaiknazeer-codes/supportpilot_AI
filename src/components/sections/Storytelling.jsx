"use client";

import { useEffect, useRef } from "react";
import { Ear, Brain, Zap, CheckCircle2 } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const stages = [
  {
    icon: Ear,
    label: "Listen",
    color: "from-violet-500 to-purple-600",
    accent: "violet",
    title: "Hear Every Customer",
    description:
      "SupportPilot AI captures every message, tone, and intent across all channels — chat, email, and voice — in real time.",
    stat: "99.7%",
    statLabel: "message capture rate",
  },
  {
    icon: Brain,
    label: "Understand",
    color: "from-purple-500 to-indigo-600",
    accent: "indigo",
    title: "Context-Aware Intelligence",
    description:
      "Natural language understanding maps customer intent, sentiment, and history to deliver precise, contextual responses.",
    stat: "< 200ms",
    statLabel: "intent classification",
  },
  {
    icon: Zap,
    label: "Act",
    color: "from-cyan-500 to-teal-500",
    accent: "cyan",
    title: "Instant Automated Action",
    description:
      "Book appointments, create tickets, update records, and process requests automatically — no human latency.",
    stat: "85%",
    statLabel: "automated resolution",
  },
  {
    icon: CheckCircle2,
    label: "Resolve",
    color: "from-emerald-500 to-green-500",
    accent: "emerald",
    title: "Complete Resolution",
    description:
      "Every interaction reaches a satisfying conclusion — resolved autonomously or seamlessly escalated to your team.",
    stat: "4.9★",
    statLabel: "customer satisfaction",
  },
];

function StageCard({ stage, index }) {
  const cardRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (cardRef.current) cardRef.current.style.opacity = "1";
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cardRef.current,
        {
          opacity: 0,
          y: 45,
          x: index % 2 === 0 ? -20 : 20,
        },
        {
          opacity: 1,
          y: 0,
          x: 0,
          duration: 0.75,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, [index]);

  const Icon = stage.icon;

  return (
    <div ref={cardRef} className="opacity-0">
      <div
        className={`relative flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
          index % 2 !== 0 ? "lg:flex-row-reverse" : ""
        }`}
      >
        {/* Visual side */}
        <div className="flex-1 flex justify-center">
          <div className="relative">
            {/* Glow backdrop */}
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stage.color} opacity-10 rounded-3xl blur-3xl scale-110`}
              aria-hidden="true"
            />
            <div className="relative glass-card p-8 sm:p-10 flex flex-col items-center text-center min-w-[240px]">
              {/* Step number */}
              <span className="text-xs font-mono text-text-muted mb-4 tracking-wider">
                STEP {String(index + 1).padStart(2, "0")}
              </span>
              {/* Icon */}
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stage.color} flex items-center justify-center mb-5 shadow-lg`}
              >
                <Icon className="w-7 h-7 text-white" />
              </div>
              {/* Label */}
              <h3 className="text-2xl font-bold text-text-primary mb-1">
                {stage.label}
              </h3>
              {/* Stat */}
              <div className="mt-4 pt-4 border-t border-border-subtle w-full">
                <p className="text-2xl font-bold gradient-text">
                  {stage.stat}
                </p>
                <p className="text-xs text-text-muted mt-1">{stage.statLabel}</p>
                <p className="text-xs text-text-muted italic mt-1">(demo data)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text side */}
        <div className="flex-1 text-center lg:text-left">
          <h4 className="text-xl sm:text-2xl font-bold text-text-primary mb-3">
            {stage.title}
          </h4>
          <p className="text-text-secondary leading-relaxed max-w-md mx-auto lg:mx-0">
            {stage.description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Storytelling() {
  const timelineRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (timelineRef.current) timelineRef.current.style.transform = "scaleY(1)";
      return;
    }

    const ctx = gsap.context(() => {
      // Animate the connecting timeline
      gsap.fromTo(
        timelineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: timelineRef.current,
            start: "top 80%",
            end: "bottom 40%",
            scrub: 1,
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  return (
    <section id="storytelling" className="relative py-24 sm:py-32 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="How It Works"
          title={
            <>
              Four Steps to{" "}
              <span className="gradient-text">Complete Resolution</span>
            </>
          }
          description="Every conversation follows a proven path from first contact to full resolution — powered by AI that never sleeps."
        />

        {/* Timeline connector (desktop) */}
        <div className="relative">
          <div
            ref={timelineRef}
            className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-accent-violet via-accent-cyan to-emerald-500 origin-top"
            aria-hidden="true"
          />

          {/* Stage cards */}
          <div className="space-y-20 lg:space-y-28">
            {stages.map((stage, index) => (
              <StageCard key={stage.label} stage={stage} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
