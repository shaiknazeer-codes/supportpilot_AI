"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import {
  MessageSquare,
  CalendarCheck,
  TicketCheck,
  UserRoundCog,
  ArrowUpRight,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import Card from "@/components/ui/Card";
import GlowOrb from "@/components/ui/GlowOrb";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const features = [
  {
    icon: MessageSquare,
    title: "AI-Powered Chat",
    description:
      "Natural conversations that understand context, intent, and sentiment. Your AI agent resolves common queries instantly while maintaining a human-like tone.",
    highlights: ["Multi-language support", "Sentiment analysis", "Smart routing"],
    gradient: "from-violet-500 to-purple-600",
  },
  {
    icon: CalendarCheck,
    title: "Smart Booking",
    description:
      "Automated appointment scheduling that syncs with your calendar. Customers book, reschedule, and cancel without waiting for a human agent.",
    highlights: ["Calendar sync", "Auto-reminders", "Timezone handling"],
    gradient: "from-cyan-500 to-blue-500",
  },
  {
    icon: TicketCheck,
    title: "Ticket Management",
    description:
      "Automatically creates, categorizes, and prioritizes support tickets. Track every interaction from first message to resolution.",
    highlights: ["Auto-categorization", "Priority scoring", "SLA tracking"],
    gradient: "from-indigo-500 to-violet-500",
  },
  {
    icon: UserRoundCog,
    title: "Human Escalation",
    description:
      "When AI reaches its limits, conversations seamlessly transfer to your team — with full context, history, and suggested responses.",
    highlights: ["Smart handoff", "Context transfer", "Agent dashboard"],
    gradient: "from-emerald-500 to-teal-500",
  },
];

function FeatureCard({ feature }) {
  const Icon = feature.icon;

  return (
    <div className="feature-card-item opacity-0 h-full">
      <Card className="h-full group relative overflow-hidden flex flex-col justify-between" gradientBorder hover>
        {/* Hover glow */}
        <div
          className={`absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br ${feature.gradient} rounded-full opacity-0 group-hover:opacity-10 blur-3xl transition-opacity duration-500 pointer-events-none`}
          aria-hidden="true"
        />

        <div className="relative z-10 flex-1 flex flex-col">
          {/* Icon */}
          <div
            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-5 shadow-lg shadow-black/20`}
          >
            <Icon className="w-5.5 h-5.5 text-white" />
          </div>

          {/* Title + arrow */}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-text-primary">{feature.title}</h3>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <ArrowUpRight className="w-4 h-4 text-text-muted" />
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-text-secondary leading-relaxed mb-5 flex-1">
            {feature.description}
          </p>

          {/* Highlights */}
          <div className="flex flex-wrap gap-2 pt-2">
            {feature.highlights.map((h) => (
              <span
                key={h}
                className="px-3 py-1 text-xs font-medium rounded-full bg-white/[0.04] border border-border-subtle text-text-muted"
              >
                {h}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function Features() {
  const sectionRef = useRef(null);
  const cardsContainerRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      if (cardsContainerRef.current) {
        const cards = cardsContainerRef.current.querySelectorAll(".feature-card-item");
        cards.forEach((c) => (c.style.opacity = "1"));
      }
      return;
    }

    const ctx = gsap.context(() => {
      // Staggered reveals for feature cards
      gsap.fromTo(
        ".feature-card-item",
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: cardsContainerRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Subtle parallax on ambient backdrop glow
      gsap.to(".features-parallax-orb", {
        y: 60,
        ease: "none",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top bottom",
          end: "bottom top",
          scrub: 1.2,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" ref={sectionRef} className="relative py-24 sm:py-32 overflow-hidden">
      {/* Subtle section separator */}
      <div className="section-divider mb-24" />

      {/* Subtle background glow with parallax */}
      <GlowOrb
        color="violet"
        size={500}
        blur={160}
        opacity={0.06}
        className="features-parallax-orb top-[10%] right-[-100px]"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <SectionHeading
          badge="Features"
          title={
            <>
              Everything You Need to{" "}
              <span className="gradient-text">Delight Customers</span>
            </>
          }
          description="Four powerful capabilities working together — so every customer gets instant, intelligent, and personal support."
        />

        <div
          ref={cardsContainerRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
