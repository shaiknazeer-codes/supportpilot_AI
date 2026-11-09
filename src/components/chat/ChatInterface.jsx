"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Bot,
  User,
  Sparkles,
  AlertCircle,
  RotateCw,
  Trash2,
  CheckCircle,
  HelpCircle,
  ArrowUpRight,
  ShieldAlert,
  Calendar,
  TicketCheck,
  UserCheck,
  AlertTriangle,
  Clock,
  Database,
  Check,
  Film,
  MapPin,
  Ticket,
  Building2,
  Stethoscope,
} from "lucide-react";
import Button from "@/components/ui/Button";

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

let messageSeq = 0;
function createMessageId(role) {
  messageSeq += 1;
  return "msg-" + Date.now() + "-" + messageSeq + "-" + role;
}

const SUGGESTED_PROMPTS = [
  {
    title: "🏥 Hospital Consultation",
    prompt: "I would like to schedule a hospital consultation. Which hospitals are available?",
    category: "Healthcare",
  },
  {
    title: "🎬 Book Movie Tickets (Indore)",
    prompt: "I want to book movie tickets in Indore. What movies are currently playing?",
    category: "Movies",
  },
  {
    title: "🎫 Log Support Ticket",
    prompt: "Please create a high-priority support ticket. The API webhooks are failing with a 504 gateway timeout. Customer email: dev@acme.com.",
    category: "Support",
  },
  {
    title: "🚨 Human Escalation",
    prompt: "My billing issue has been pending for days and is unresolved. Please escalate this request to a human support specialist.",
    category: "Escalation",
  },
];

/**
 * Renders structured operational action badges and cards confirming real backend tool executions.
 */
function ActionCard({ action, onSelectSlot }) {
  const { toolName, result, success } = action;

  if (toolName === "getHospitalsAndSlots") {
    if (!success) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{result?.message || "Could not fetch hospital consultation slots."}</span>
        </div>
      );
    }

    // Stage 1: Hospital List
    if (result?.hospitals && result.hospitals.length > 0) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-text-primary">
          <div className="flex items-center gap-2 mb-2 font-semibold text-emerald-300">
            <Building2 className="w-4 h-4 text-emerald-400" />
            <span>Premier Partner Hospitals</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 ml-auto">
              Live Network
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {result.hospitals.map((h) => (
              <div
                key={h.name}
                className="p-2.5 rounded-lg bg-bg-primary/80 border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <span className="font-semibold text-text-primary text-[12px] block flex items-center gap-1">
                    <Stethoscope className="w-3.5 h-3.5 text-accent-cyan" />
                    {h.name}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {h.location}
                  </span>
                  <span className="text-[10px] text-text-secondary block mt-1 font-mono">
                    Specialties: {h.departments.join(", ")}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-emerald-400 font-mono font-medium flex items-center justify-between">
                  <span>{h.availableDays?.length || 6} Days/Week</span>
                  <span>{h.fee}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Stage 2 & 3: Hospital Timings & Days
    if (result?.hospital) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-xs text-text-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-accent-cyan-light">
              <Building2 className="w-4 h-4 text-accent-cyan" />
              <span>{result.hospital}</span>
            </div>
            {result.fee && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-400">
                {result.fee}
              </span>
            )}
          </div>
          <div className="p-2.5 rounded-lg bg-bg-primary/90 border border-border-subtle mt-2">
            <div className="mb-2">
              <span className="text-[11px] text-text-muted flex items-center gap-1">
                <MapPin className="w-3 h-3 text-accent-violet-light" />
                {result.location}
              </span>
              <span className="text-[10px] text-accent-cyan block mt-0.5 font-mono">
                Departments: {result.departments?.join(", ")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              <span className="text-[10px] text-text-muted mr-1 font-medium">Slots:</span>
              {result.timings?.map((timing) => (
                <button
                  key={timing}
                  type="button"
                  onClick={() => onSelectSlot && onSelectSlot(`${timing} on ${result.requestedDay || 'Monday'} at ${result.hospital}`)}
                  className="px-2 py-1 rounded bg-accent-cyan/15 hover:bg-accent-cyan/30 border border-accent-cyan/30 text-[10px] font-mono text-accent-cyan-light hover:text-white transition-all cursor-pointer"
                  title="Click to select consultation slot"
                >
                  {timing}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
  }

  if (toolName === "bookHospitalConsultation" || (toolName === "createBooking" && (result?.hospital || result?.bookingType === "hospital_consultation"))) {
    if (result?.requiresConfirmation) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1.5">
            <Stethoscope className="w-4 h-4 text-amber-400" />
            <span>Consultation Confirmation Requested</span>
          </div>
          <p className="text-text-muted text-[11px]">
            {result?.message || `Ready to book at ${result?.pendingDetails?.hospital} on ${result?.pendingDetails?.day} at ${result?.pendingDetails?.time}. Reply 'Confirm' to finalize.`}
          </p>
        </div>
      );
    }

    if (success && result?.bookingId) {
      return (
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-blue-500/15 border border-emerald-500/40 text-xs shadow-lg">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Building2 className="w-4 h-4 text-emerald-400" />
              <span>Hospital Consultation Confirmed in MongoDB</span>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
              {result.bookingId}
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-text-primary tracking-tight flex items-center gap-1.5">
                <Stethoscope className="w-4 h-4 text-emerald-400" />
                {result.hospital}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {result.department || "General Medicine"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-text-muted text-[11px] pt-1">
              <div>
                <span className="text-text-secondary font-medium">Day & Time: </span>
                {result.day} at {result.time}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Location: </span>
                {result.location}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Patient: </span>
                {result.customerName}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Email: </span>
                {result.customerEmail}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  if (toolName === "getMovieShowtimes") {
    if (!success) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
          <span>{result?.message || "Could not fetch movie showtimes."}</span>
        </div>
      );
    }

    // Stage 1: Movies List
    if (result?.movies && result.movies.length > 0) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-accent-violet/10 border border-accent-violet/30 text-xs text-text-primary">
          <div className="flex items-center gap-2 mb-2 font-semibold text-accent-violet-light">
            <Film className="w-4 h-4 text-accent-cyan" />
            <span>Currently Screening in Theaters</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-violet/20 text-accent-violet-light ml-auto">
              Live Catalog
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {result.movies.map((m) => (
              <div
                key={m.title}
                className="p-2.5 rounded-lg bg-bg-primary/80 border border-white/5 flex flex-col justify-between"
              >
                <div>
                  <span className="font-semibold text-text-primary text-[12px] block">
                    {m.title}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {m.genre} · {m.duration} · {m.rating}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-accent-cyan">
                  {m.theatersAvailable?.length || 3} Theaters Available
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Stage 2 & 3: Theaters and Showtimes
    if (result?.theaters && result.theaters.length > 0) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-xs text-text-primary">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 font-semibold text-accent-cyan-light">
              <Film className="w-4 h-4 text-accent-cyan" />
              <span>{result.movie} — Cinema Showtimes</span>
            </div>
            {result.rating && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-text-secondary">
                {result.rating} · {result.duration}
              </span>
            )}
          </div>
          <div className="space-y-2.5 mt-2">
            {result.theaters.map((t) => (
              <div
                key={t.name}
                className="p-2.5 rounded-lg bg-bg-primary/90 border border-border-subtle"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="font-semibold text-text-primary flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-accent-violet-light" />
                      {t.name}
                    </span>
                    <span className="text-[10px] text-text-muted block">{t.location}</span>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-emerald-400">
                    {t.price}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  {t.timings?.map((timing) => (
                    <button
                      key={timing}
                      type="button"
                      onClick={() => onSelectSlot && onSelectSlot(`${timing} at ${t.name}`, result.movie)}
                      className="px-2 py-1 rounded bg-accent-cyan/15 hover:bg-accent-cyan/30 border border-accent-cyan/30 text-[10px] font-mono text-accent-cyan-light hover:text-white transition-all cursor-pointer"
                      title="Click to select showtime"
                    >
                      {timing}
                    </button>
                  ))}
                  <span className="text-[10px] text-text-muted ml-auto font-mono">
                    {t.formats?.join(" · ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  if (toolName === "bookMovieTicket" || (toolName === "createBooking" && (result?.movie || result?.bookingType === "movie_ticket"))) {
    if (result?.requiresConfirmation) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs">
          <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1.5">
            <Ticket className="w-4 h-4 text-amber-400" />
            <span>Movie Ticket Confirmation Requested</span>
          </div>
          <p className="text-text-muted text-[11px]">
            {result?.message || `Ready to book ${result?.pendingDetails?.movie} at ${result?.pendingDetails?.theater}. Reply 'Confirm' to finalize.`}
          </p>
        </div>
      );
    }

    if (success && result?.bookingId) {
      return (
        <div className="mt-3 p-4 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-accent-cyan/15 border border-emerald-500/40 text-xs shadow-lg">
          <div className="flex items-center justify-between mb-2 pb-2 border-b border-emerald-500/20">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <Ticket className="w-4 h-4 text-emerald-400" />
              <span>Movie Ticket Confirmed in MongoDB</span>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
              {result.bookingId}
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-text-primary tracking-tight">
                🎬 {result.movie}
              </span>
              <span className="text-[11px] font-mono text-emerald-400 font-semibold">
                {result.seatsCount ? `${result.seatsCount} Seats` : "Confirmed"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-text-muted text-[11px] pt-1">
              <div>
                <span className="text-text-secondary font-medium">Cinema: </span>
                {result.theater}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Showtime: </span>
                {result.showtime}
              </div>
              {result.seatNumbers && (
                <div className="col-span-2">
                  <span className="text-text-secondary font-medium">Assigned Seats: </span>
                  <span className="text-accent-cyan-light font-mono font-medium">{result.seatNumbers}</span>
                </div>
              )}
              <div>
                <span className="text-text-secondary font-medium">Customer: </span>
                {result.customerName}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Email: </span>
                {result.customerEmail}
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  if (toolName === "createTicket") {
    if (success && result?.ticketId) {
      return (
        <div className="mt-3 p-3 rounded-xl bg-gradient-to-r from-accent-violet/10 to-indigo-500/10 border border-accent-violet/30 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-accent-violet-light">
              <TicketCheck className="w-4 h-4" />
              <span>Support Ticket Created in MongoDB</span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-accent-violet/20 text-accent-violet-light border border-accent-violet/40 font-semibold">
              {result.ticketId}
            </span>
          </div>
          <p className="text-text-muted text-[11px] truncate">
            Subject: <span className="text-text-secondary">{result.subject}</span> · Priority:{" "}
            <span className="capitalize font-semibold text-text-primary">{result.priority}</span>
          </p>
        </div>
      );
    }
  }

  if (toolName === "escalateToHuman") {
    if (success && result?.ticketId) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-rose-500/15 to-purple-500/15 border border-rose-500/40 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 font-bold text-rose-300">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Escalated to Human Support</span>
            </div>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
              {result.ticketId}
            </span>
          </div>
          <p className="text-text-muted text-[11px] mb-1">
            Status set to <span className="text-rose-400 font-semibold uppercase">Escalated</span> (Priority: Urgent)
          </p>
          <p className="text-text-secondary text-[11px]">
            Queue: <span className="text-accent-cyan">{result.queue}</span>
          </p>
        </div>
      );
    }
  }

  if (toolName === "recordLead") {
    if (success && result?.leadId) {
      return (
        <div className="mt-3 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-xs flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-blue-300 font-medium">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Lead Recorded ({result.name})</span>
          </div>
          <span className="font-mono text-[11px] text-blue-200">{result.leadId}</span>
        </div>
      );
    }
  }

  return null;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState(null);
  const mounted = useMounted();

  const messagesContainerRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Keep window at top when entering /chat page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Only scroll the inner chat container when messages or state change
  useEffect(() => {
    if (messages.length > 0 || isLoading || errorState) {
      scrollToBottom();
    }
  }, [messages, isLoading, errorState]);

  const formatTimestamp = (date) => {
    if (!mounted) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date ? new Date(date) : new Date());
  };

  const handleSendMessage = async (textToSend) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    setErrorState(null);
    setInput("");

    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      content: content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: newMessages.map(({ role, content }) => ({ role, content })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          message: data.error || "Failed to receive response from AI backend.",
          code: data.code || "REQUEST_FAILED",
          hint: data.hint,
          failedPrompt: content,
        };
      }

      if (data.message) {
        const assistantMessage = {
          id: createMessageId("ai"),
          role: "assistant",
          content: data.message.content,
          timestamp: data.message.timestamp || new Date().toISOString(),
          model: data.model,
          toolActions: data.toolActions || [],
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (err) {
      console.error("Chat request error:", err);
      setErrorState({
        message: err.message || "An unexpected network error occurred.",
        code: err.code || "NETWORK_ERROR",
        hint: err.hint,
        failedPrompt: content,
      });
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100);
    }
  };

  const handleSelectSlot = (slotIso, date) => {
    const timeFormatted = new Date(slotIso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    handleSendMessage(`I'd like to book the ${timeFormatted} UTC slot on ${date}. Please confirm my appointment.`);
  };

  const handleRetry = () => {
    if (errorState?.failedPrompt) {
      const promptToRetry = errorState.failedPrompt;
      setMessages((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].content === promptToRetry) {
          return prev.slice(0, -1);
        }
        return prev;
      });
      handleSendMessage(promptToRetry);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    if (confirm("Are you sure you want to clear this conversation?")) {
      setMessages([]);
      setErrorState(null);
    }
  };

  return (
    <div className="flex flex-col h-[750px] max-h-[85vh] w-full max-w-5xl mx-auto glass-card border border-glass-border rounded-2xl overflow-hidden shadow-2xl relative glow-violet">
      {/* Top Header Panel */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-bg-secondary/90 border-b border-border-subtle backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center shadow-md shadow-accent-violet/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-bg-secondary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-text-primary tracking-tight">
                SupportPilot AI Operations Agent
              </h2>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Phase 4 Real Tools
              </span>
            </div>
            <p className="text-xs text-text-muted">
              Live Tool Calling: Booking · Tickets · Leads · Escalations · MongoDB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
              title="Clear conversation"
              aria-label="Clear conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin"
      >
        {/* Empty State with Suggested Operational Prompts */}
        {messages.length === 0 && !errorState && (
          <div className="h-full flex flex-col justify-center items-center text-center px-4 py-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20 border border-border-accent flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-accent-violet-light" />
            </div>

            <h3 className="text-xl font-bold text-text-primary mb-2">
              How can SupportPilot assist you today?
            </h3>
            <p className="text-sm text-text-secondary max-w-md mb-8">
              Ask operational questions, check real calendar slots, book consultations, log support tickets, or request human escalation.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl text-left">
              {SUGGESTED_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.prompt)}
                  className="p-3.5 rounded-xl bg-white/[0.02] border border-border-subtle hover:border-accent-violet/40 hover:bg-white/[0.05] transition-all duration-200 group flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between w-full mb-1.5">
                    <span className="text-[11px] font-mono tracking-wider text-accent-cyan uppercase">
                      {item.category}
                    </span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-violet-light transition-colors" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-text-primary group-hover:text-accent-violet-light transition-colors line-clamp-2">
                    {item.prompt}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message Bubbles */}
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.25 }}
              className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center text-white ${
                  isUser
                    ? "bg-gradient-to-tr from-accent-cyan to-blue-600"
                    : "bg-gradient-to-br from-accent-violet to-purple-600"
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Bubble Body */}
              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl px-4 py-3 shadow-md ${
                  isUser
                    ? "bg-accent-violet/20 border border-accent-violet/30 text-text-primary rounded-tr-sm"
                    : "bg-bg-tertiary/90 border border-border-subtle text-text-primary rounded-tl-sm backdrop-blur-sm"
                }`}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {message.content}
                </div>

                {/* Render Structured Tool Action Badges */}
                {message.toolActions && message.toolActions.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {message.toolActions.map((action, i) => (
                      <ActionCard
                        key={i}
                        action={action}
                        onSelectSlot={handleSelectSlot}
                      />
                    ))}
                  </div>
                )}

                <div
                  className={`mt-2 flex items-center gap-1.5 text-[10px] text-text-muted ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <span>{formatTimestamp(message.timestamp)}</span>
                  {message.model && (
                    <>
                      <span>·</span>
                      <span className="font-mono text-[9px] text-accent-cyan/80">
                        {message.model}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Loading / Typing Indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <div className="w-8 h-8 rounded-xl flex-shrink-0 bg-gradient-to-br from-accent-violet to-purple-600 flex items-center justify-center text-white">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-bg-tertiary/90 border border-border-subtle rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet typing-dot" />
                <span className="w-1.5 h-1.5 rounded-full bg-accent-violet typing-dot" />
              </div>
              <span className="text-xs text-text-muted italic ml-1">
                SupportPilot is reasoning & executing operations...
              </span>
            </div>
          </motion.div>
        )}

        {/* Error Notification & Retry Banner */}
        {errorState && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-text-primary max-w-2xl mx-auto"
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-rose-300">
                    {errorState.code === "MISSING_API_KEY"
                      ? "Configuration Required"
                      : "Operation Request Failed"}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    {errorState.code}
                  </span>
                </div>
                <p className="text-text-secondary text-xs sm:text-sm mb-2">
                  {errorState.message}
                </p>

                {errorState.code === "MISSING_API_KEY" && (
                  <div className="p-2.5 rounded-lg bg-black/40 border border-white/[0.06] text-xs font-mono text-text-muted mb-3 space-y-1">
                    <div className="text-accent-cyan font-sans font-medium mb-1">
                      Setup Instructions:
                    </div>
                    <div>1. Create a <span className="text-white">.env.local</span> file in the project root.</div>
                    <div>2. Add: <span className="text-accent-violet-light">OPENAI_API_KEY=your_actual_key</span></div>
                    <div>3. Add: <span className="text-accent-violet-light">MONGODB_URI=your_mongodb_atlas_uri</span></div>
                    <div>4. Restart dev server, then click Retry below.</div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleRetry}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-500/20 text-rose-200 hover:bg-rose-500/30 border border-rose-500/40 transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    Retry Message
                  </button>
                  <button
                    onClick={() => setErrorState(null)}
                    className="text-xs text-text-muted hover:text-text-secondary"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 sm:p-4 bg-bg-secondary/95 border-t border-border-subtle">
        <div className="flex items-end gap-2 bg-white/[0.03] border border-border-subtle focus-within:border-accent-violet/50 rounded-xl p-2 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Type your message"
            placeholder="Type your inquiry, request consultation slots, or describe an issue... (Enter to send)"
            className="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm text-text-primary placeholder:text-text-muted resize-none max-h-32 min-h-[40px] py-2 px-2"
          />

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleSendMessage()}
            disabled={!input.trim() || isLoading}
            className="!px-4 !py-2 h-[40px] flex-shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </Button>
        </div>

        <div className="mt-2 flex items-center justify-between text-[11px] text-text-muted px-1">
          <span>Active Tools: checkAvailability · createBooking · createTicket · recordLead · escalateToHuman</span>
          <span className="hidden sm:inline">MongoDB Persistent Storage</span>
        </div>
      </div>
    </div>
  );
}
