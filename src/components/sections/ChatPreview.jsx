"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Send, ArrowRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Demo conversation data ── */
const DEMO_MESSAGES = [
  {
    id: 1,
    sender: "user",
    text: "Hi, I need to reschedule my appointment for next week.",
    delay: 0,
  },
  {
    id: 2,
    sender: "ai",
    text: "Of course! I can see your appointment on Thursday at 2 PM. Would you prefer Monday, Tuesday, or Wednesday next week?",
    delay: 1200,
  },
  {
    id: 3,
    sender: "user",
    text: "Tuesday at 10 AM works best.",
    delay: 2800,
  },
  {
    id: 4,
    sender: "ai",
    text: "Done! ✅ Your appointment has been rescheduled to Tuesday at 10:00 AM. You'll receive a confirmation email shortly. Anything else I can help with?",
    delay: 4200,
  },
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3">
      <div className="w-1.5 h-1.5 rounded-full bg-accent-violet-light typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-accent-violet-light typing-dot" />
      <div className="w-1.5 h-1.5 rounded-full bg-accent-violet-light typing-dot" />
    </div>
  );
}

function ChatBubble({ message }) {
  const isAI = message.sender === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={`flex items-start gap-2.5 ${isAI ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white ${
          isAI
            ? "bg-gradient-to-br from-accent-violet to-accent-cyan"
            : "bg-white/10"
        }`}
      >
        {isAI ? <Bot className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isAI
            ? "bg-white/[0.06] text-text-primary border border-white/[0.06] rounded-tl-md"
            : "bg-accent-violet/20 text-text-primary border border-accent-violet/20 rounded-tr-md"
        }`}
      >
        {message.text}
      </div>
    </motion.div>
  );
}

export default function ChatPreview() {
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasPlayed, setHasPlayed] = useState(false);
  const containerRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // ScrollTrigger to start animation and fade-up when section enters viewport
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReduced) {
      if (containerRef.current) containerRef.current.style.opacity = "1";
      const timer = setTimeout(() => {
        setVisibleMessages(DEMO_MESSAGES);
      }, 0);
      return () => clearTimeout(timer);
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top 85%",
            once: true,
            onEnter: () => setHasPlayed(true),
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  // Animate messages sequentially
  useEffect(() => {
    if (!hasPlayed) return;

    const timeouts = [];

    DEMO_MESSAGES.forEach((msg, i) => {
      // Show typing before AI messages
      if (msg.sender === "ai") {
        const typingTimeout = setTimeout(() => {
          setIsTyping(true);
        }, msg.delay - 800);
        timeouts.push(typingTimeout);
      }

      const msgTimeout = setTimeout(() => {
        setIsTyping(false);
        setVisibleMessages((prev) => [...prev, msg]);
      }, msg.delay);
      timeouts.push(msgTimeout);
    });

    return () => timeouts.forEach(clearTimeout);
  }, [hasPlayed]);

  // Auto-scroll ONLY within the inner chat box widget, NEVER the window page
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [visibleMessages, isTyping]);

  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center" ref={containerRef}>
          {/* Chat window */}
          <div className="w-full max-w-md glass-card overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-border-subtle">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  SupportPilot AI
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs text-text-muted">Online — Demo Conversation</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="h-80 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
            >
              <AnimatePresence>
                {visibleMessages.map((msg) => (
                  <ChatBubble key={msg.id} message={msg} />
                ))}
              </AnimatePresence>
              {isTyping && <TypingIndicator />}
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-border-subtle">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-border-subtle">
                <span className="flex-1 text-sm text-text-muted">
                  Type a message...
                </span>
                <button
                  className="w-8 h-8 rounded-lg bg-accent-violet/20 flex items-center justify-center text-accent-violet-light hover:bg-accent-violet/30 transition-colors"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center mt-8 text-center">
          <Button variant="secondary" size="md" href="/chat" icon={<ArrowRight className="w-4 h-4" />}>
            Open Live AI Assistant
          </Button>
          <p className="text-xs text-text-muted mt-2">
            Test custom customer operations prompts in real-time
          </p>
        </div>
      </div>
    </section>
  );
}
