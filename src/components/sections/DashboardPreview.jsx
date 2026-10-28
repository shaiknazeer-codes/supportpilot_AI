"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Bot,
  Database,
  Plus,
  RotateCw,
  Calendar,
  TicketCheck,
  Send,
  Check,
} from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/* ── Fallback demo dashboard data when MongoDB Atlas is not yet configured ── */
const fallbackStats = [
  {
    label: "Active Conversations",
    value: "1,247",
    change: "+12.5%",
    positive: true,
    icon: MessageSquare,
  },
  {
    label: "Resolved Today",
    value: "892",
    change: "+8.3%",
    positive: true,
    icon: CheckCircle2,
  },
  {
    label: "Avg. Response Time",
    value: "1.2s",
    change: "-23%",
    positive: true,
    icon: Clock,
  },
  {
    label: "Customer Satisfaction",
    value: "98.4%",
    change: "+2.1%",
    positive: true,
    icon: TrendingUp,
  },
];

const fallbackTickets = [
  { id: "TK-4012", subject: "Payment processing issue", status: "Resolved", priority: "High", time: "2m ago" },
  { id: "TK-4011", subject: "Account access request", status: "In Progress", priority: "Medium", time: "8m ago" },
  { id: "TK-4010", subject: "Feature request: dark mode", status: "Open", priority: "Low", time: "15m ago" },
  { id: "TK-4009", subject: "Billing inquiry — Pro plan", status: "Escalated", priority: "High", time: "22m ago" },
];

const statusColors = {
  resolved: "text-emerald-400 bg-emerald-400/10",
  Resolved: "text-emerald-400 bg-emerald-400/10",
  "in_progress": "text-amber-400 bg-amber-400/10",
  "In Progress": "text-amber-400 bg-amber-400/10",
  open: "text-blue-400 bg-blue-400/10",
  Open: "text-blue-400 bg-blue-400/10",
  escalated: "text-rose-400 bg-rose-400/10",
  Escalated: "text-rose-400 bg-rose-400/10",
};

const priorityColors = {
  high: "text-rose-400",
  High: "text-rose-400",
  urgent: "text-rose-500 font-bold",
  medium: "text-amber-400",
  Medium: "text-amber-400",
  low: "text-blue-400",
  Low: "text-blue-400",
};

function MiniChart() {
  const bars = [35, 52, 44, 68, 58, 72, 85, 78, 92, 88, 95, 82];
  const maxH = 40;

  return (
    <div className="flex items-end gap-1 h-10">
      {bars.map((val, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-t-sm bg-gradient-to-t from-accent-violet to-accent-cyan"
          initial={{ height: 0 }}
          whileInView={{ height: `${(val / 100) * maxH}px` }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.05, duration: 0.5, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

export default function DashboardPreview() {
  const sectionRef = useRef(null);
  const dashRef = useRef(null);

  // Live Database State
  const [dbStatus, setDbStatus] = useState({ connected: false, loading: true });
  const [dbData, setDbData] = useState(null);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    customerEmail: "",
    priority: "medium",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);

  const fetchDashboardStats = async () => {
    try {
      const res = await fetch("/api/dashboard/stats");
      const data = await res.json();
      if (res.ok && data.connected) {
        setDbStatus({ connected: true, loading: false, database: data.database });
        setDbData(data);
      } else {
        setDbStatus({ connected: false, loading: false, message: data.message });
      }
    } catch {
      setDbStatus({ connected: false, loading: false });
    }
  };

  useEffect(() => {
    let ignore = false;
    async function loadStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        if (ignore) return;
        if (res.ok && data.connected) {
          setDbStatus({ connected: true, loading: false, database: data.database });
          setDbData(data);
        } else {
          setDbStatus({ connected: false, loading: false, message: data.message });
        }
      } catch {
        if (!ignore) setDbStatus({ connected: false, loading: false });
      }
    }
    loadStats();
    return () => {
      ignore = true;
    };
  }, []);

  const handleCreateTestTicket = async (e) => {
    e.preventDefault();
    if (!ticketForm.subject.trim() || !ticketForm.customerEmail.trim()) return;

    setFormSubmitting(true);
    setFormFeedback(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: ticketForm.subject,
          description: ticketForm.description || "Operational ticket submitted from Dashboard preview.",
          customerEmail: ticketForm.customerEmail,
          priority: ticketForm.priority,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to create ticket.");
      }

      setFormFeedback({
        type: "success",
        message: `Confirmed in MongoDB: ${result.ticket.ticketId}`,
      });
      setTicketForm({ subject: "", description: "", customerEmail: "", priority: "medium" });
      await fetchDashboardStats();
      setTimeout(() => {
        setIsCreatingTicket(false);
        setFormFeedback(null);
      }, 2500);
    } catch (err) {
      setFormFeedback({ type: "error", message: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      gsap.set(dashRef.current, { opacity: 1 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        dashRef.current,
        { opacity: 0, y: 60, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // Compute live cards if MongoDB is connected, otherwise fallback to demo
  const displayedStats =
    dbStatus.connected && dbData
      ? [
          {
            label: "Total Bookings",
            value: String(dbData.stats.totalBookings),
            change: "Live DB",
            positive: true,
            icon: Calendar,
          },
          {
            label: "Active Tickets",
            value: String(dbData.stats.openTickets),
            change: "Live DB",
            positive: true,
            icon: TicketCheck,
          },
          {
            label: "Resolved Tickets",
            value: String(dbData.stats.resolvedTickets),
            change: "Live DB",
            positive: true,
            icon: CheckCircle2,
          },
          {
            label: "Captured Leads",
            value: String(dbData.stats.totalLeads),
            change: "Live DB",
            positive: true,
            icon: Users,
          },
        ]
      : fallbackStats;

  return (
    <section
      id="dashboard"
      ref={sectionRef}
      className="relative py-24 sm:py-32 overflow-hidden"
    >
      <div className="section-divider mb-24" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          badge="Operations Center"
          title={
            <>
              Your Command Center,{" "}
              <span className="gradient-text">Powered by MongoDB</span>
            </>
          }
          description="Real-time persistent records, active customer tickets, appointment bookings, and lead telemetry."
        />

        {/* Dashboard mockup */}
        <div ref={dashRef} className="opacity-0">
          <div className="glass-card p-1 rounded-2xl glow-violet">
            <div className="bg-bg-secondary rounded-xl overflow-hidden">
              {/* Dashboard header bar */}
              <div className="flex flex-wrap items-center justify-between px-5 py-3 border-b border-border-subtle gap-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-rose-500/60" />
                    <div className="w-3 h-3 rounded-full bg-amber-500/60" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                  </div>
                  <span className="text-xs text-text-muted font-mono ml-2">
                    dashboard.supportpilot.ai
                  </span>
                </div>

                {/* Database Connectivity Status */}
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${
                      dbStatus.connected
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        dbStatus.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    <Database className="w-3 h-3" />
                    <span>
                      {dbStatus.connected
                        ? `MongoDB Atlas: Connected (${dbStatus.database || "supportpilot"})`
                        : "MongoDB: Unconfigured (Demo Data Active)"}
                    </span>
                  </div>

                  <a
                    href="/dashboard"
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-accent-violet/20 hover:bg-accent-violet/30 border border-accent-violet/40 text-accent-violet-light font-medium transition-all"
                  >
                    <span>Full Console</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>

                  <button
                    onClick={fetchDashboardStats}
                    className="p-1 text-text-muted hover:text-text-primary rounded hover:bg-white/[0.04]"
                    title="Refresh database totals"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dashboard content */}
              <div className="p-5 space-y-5">
                {/* Stats row */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {displayedStats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                      <div
                        key={stat.label}
                        className="bg-white/[0.02] rounded-xl p-4 border border-border-subtle"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className="w-4 h-4 text-text-muted" />
                          <span
                            className={`text-xs font-medium flex items-center gap-0.5 ${
                              stat.positive ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {stat.change}
                          </span>
                        </div>
                        <p className="text-xl font-bold text-text-primary">
                          {stat.value}
                        </p>
                        <p className="text-xs text-text-muted mt-1">
                          {stat.label}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Two-column: chart + tickets */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
                  {/* Chart */}
                  <div className="lg:col-span-2 bg-white/[0.02] rounded-xl p-4 border border-border-subtle flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">
                            Resolution Telemetry
                          </p>
                          <p className="text-xs text-text-muted">
                            {dbStatus.connected ? "Real-time activity pulse" : "Simulated trend (demo data)"}
                          </p>
                        </div>
                        <BarChart3 className="w-4 h-4 text-text-muted" />
                      </div>
                      <MiniChart />
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle text-xs text-text-muted flex justify-between items-center">
                      <span>Collections: bookings · tickets · leads</span>
                      <span className="font-mono text-[10px] text-accent-cyan">
                        {dbStatus.connected ? "MongoDB Synchronized" : "Demo Mode"}
                      </span>
                    </div>
                  </div>

                  {/* Recent tickets / Live Database Records */}
                  <div className="lg:col-span-3 bg-white/[0.02] rounded-xl p-4 border border-border-subtle">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-semibold text-text-primary">
                          {dbStatus.connected ? "Live Support Tickets" : "Recent Tickets"}
                        </p>
                        <span className="text-xs text-text-muted">
                          {dbStatus.connected ? "Directly from MongoDB collection" : "(demo preview data)"}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsCreatingTicket(!isCreatingTicket)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-accent-violet/10 text-accent-violet-light border border-accent-violet/20 hover:bg-accent-violet/20 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{isCreatingTicket ? "Close Form" : "Test DB Write"}</span>
                      </button>
                    </div>

                    {/* Interactive Ticket Form for Testing Real DB Writes */}
                    <AnimatePresence>
                      {isCreatingTicket && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleCreateTestTicket}
                          className="mb-4 p-3 rounded-lg bg-black/40 border border-border-accent space-y-2 overflow-hidden"
                        >
                          <p className="text-xs font-semibold text-accent-violet-light">
                            Submit Live Ticket to MongoDB:
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              required
                              placeholder="Issue Subject (min 3 chars)"
                              value={ticketForm.subject}
                              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                              className="px-2.5 py-1.5 text-xs rounded bg-white/[0.04] border border-border-subtle focus:border-accent-violet text-text-primary"
                            />
                            <input
                              type="email"
                              required
                              placeholder="Customer Email"
                              value={ticketForm.customerEmail}
                              onChange={(e) => setTicketForm({ ...ticketForm, customerEmail: e.target.value })}
                              className="px-2.5 py-1.5 text-xs rounded bg-white/[0.04] border border-border-subtle focus:border-accent-violet text-text-primary"
                            />
                          </div>
                          <div className="flex items-center justify-between pt-1">
                            <select
                              value={ticketForm.priority}
                              onChange={(e) => setTicketForm({ ...ticketForm, priority: e.target.value })}
                              className="px-2 py-1 text-xs rounded bg-bg-tertiary border border-border-subtle text-text-primary"
                            >
                              <option value="low">Low Priority</option>
                              <option value="medium">Medium Priority</option>
                              <option value="high">High Priority</option>
                              <option value="urgent">Urgent</option>
                            </select>

                            <button
                              type="submit"
                              disabled={formSubmitting}
                              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded bg-gradient-to-r from-accent-violet to-accent-cyan text-white font-medium hover:brightness-110 disabled:opacity-50"
                            >
                              <Send className="w-3 h-3" />
                              <span>{formSubmitting ? "Writing..." : "Insert Document"}</span>
                            </button>
                          </div>

                          {formFeedback && (
                            <div
                              className={`text-xs p-1.5 rounded ${
                                formFeedback.type === "success"
                                  ? "bg-emerald-500/20 text-emerald-300"
                                  : "bg-rose-500/20 text-rose-300"
                              }`}
                            >
                              {formFeedback.message}
                            </div>
                          )}
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {/* Ticket List */}
                    <div className="space-y-2">
                      {dbStatus.connected && dbData?.recentTickets?.length > 0 ? (
                        dbData.recentTickets.map((ticket) => (
                          <div
                            key={ticket.ticketId}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors border border-white/[0.02]"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono text-accent-cyan flex-shrink-0">
                                {ticket.ticketId}
                              </span>
                              <span className="text-sm text-text-secondary truncate">
                                {ticket.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                                  statusColors[ticket.status] || "text-blue-400 bg-blue-400/10"
                                }`}
                              >
                                {ticket.status}
                              </span>
                              <span
                                className={`text-xs hidden sm:inline capitalize ${
                                  priorityColors[ticket.priority] || "text-amber-400"
                                }`}
                              >
                                {ticket.priority}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : dbStatus.connected ? (
                        <p className="text-xs text-text-muted italic py-4 text-center">
                          No tickets created in MongoDB yet. Click &quot;Test DB Write&quot; to insert one.
                        </p>
                      ) : (
                        fallbackTickets.map((ticket) => (
                          <div
                            key={ticket.id}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="text-xs font-mono text-text-muted flex-shrink-0">
                                {ticket.id}
                              </span>
                              <span className="text-sm text-text-secondary truncate">
                                {ticket.subject}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  statusColors[ticket.status]
                                }`}
                              >
                                {ticket.status}
                              </span>
                              <span
                                className={`text-xs hidden sm:inline ${
                                  priorityColors[ticket.priority]
                                }`}
                              >
                                {ticket.priority}
                              </span>
                              <span className="text-xs text-text-muted hidden md:inline">
                                {ticket.time}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
