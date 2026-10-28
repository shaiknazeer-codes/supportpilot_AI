"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  TicketCheck,
  ShieldAlert,
  Users,
  Search,
  Filter,
  RotateCw,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  User,
  Mail,
  Building,
  Tag,
  MessageSquare,
  Sparkles,
  ExternalLink,
  X,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import GlowOrb from "@/components/ui/GlowOrb";
import Button from "@/components/ui/Button";

const priorityBadges = {
  urgent: "bg-rose-500/20 text-rose-300 border-rose-500/40",
  high: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  medium: "bg-blue-500/20 text-blue-300 border-blue-500/40",
  low: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
};

const statusBadges = {
  escalated: "bg-rose-950 text-rose-300 border-rose-700 font-semibold",
  open: "bg-blue-950 text-blue-300 border-blue-700",
  in_progress: "bg-amber-950 text-amber-300 border-amber-700",
  resolved: "bg-emerald-950 text-emerald-300 border-emerald-700",
  closed: "bg-zinc-900 text-zinc-400 border-zinc-700",
  confirmed: "bg-emerald-950 text-emerald-300 border-emerald-700",
  pending: "bg-amber-950 text-amber-300 border-amber-700",
  rescheduled: "bg-purple-950 text-purple-300 border-purple-700",
  cancelled: "bg-rose-950 text-rose-400 border-rose-800",
  completed: "bg-teal-950 text-teal-300 border-teal-700",
  new: "bg-blue-950 text-blue-300 border-blue-700",
  contacted: "bg-amber-950 text-amber-300 border-amber-700",
  qualified: "bg-purple-950 text-purple-300 border-purple-700",
  converted: "bg-emerald-950 text-emerald-300 border-emerald-700",
};

export default function OperationalDashboard() {
  const [activeTab, setActiveTab] = useState("tickets"); // "tickets", "bookings", "leads", "activity"
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Tab Data States
  const [tickets, setTickets] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [leads, setLeads] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Search & Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Selected Ticket for Detail Drawer
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketEditForm, setTicketEditForm] = useState({
    status: "",
    priority: "",
    assignedTo: "",
    resolutionNotes: "",
  });
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateFeedback, setUpdateFeedback] = useState(null);

  // Auto-refresh control
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats?t=" + Date.now());
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const fetchTabData = useCallback(async () => {
    setDataLoading(true);
    try {
      const q = encodeURIComponent(searchQuery);
      if (activeTab === "tickets") {
        const res = await fetch(
          `/api/tickets?search=${q}&status=${statusFilter}&priority=${priorityFilter}&limit=50&t=` + Date.now()
        );
        const data = await res.json();
        setTickets(data.tickets || []);
      } else if (activeTab === "bookings") {
        const res = await fetch(
          `/api/bookings?search=${q}&status=${statusFilter}&limit=50&t=` + Date.now()
        );
        const data = await res.json();
        setBookings(data.bookings || []);
      } else if (activeTab === "leads") {
        const res = await fetch(
          `/api/leads?search=${q}&status=${statusFilter}&limit=50&t=` + Date.now()
        );
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (err) {
      console.error("Failed to fetch tab data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter, priorityFilter]);

  // Initial stats fetch
  useEffect(() => {
    let ignore = false;
    async function initStats() {
      try {
        const res = await fetch("/api/dashboard/stats?t=" + Date.now());
        const data = await res.json();
        if (!ignore) {
          setStats(data);
          setStatsLoading(false);
        }
      } catch {
        if (!ignore) setStatsLoading(false);
      }
    }
    initStats();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch tab data whenever activeTab, statusFilter, priorityFilter change
  useEffect(() => {
    let ignore = false;
    async function loadTabData() {
      try {
        const q = encodeURIComponent(searchQuery);
        let url = `/api/tickets?search=${q}&status=${statusFilter}&priority=${priorityFilter}&limit=50&t=` + Date.now();
        if (activeTab === "bookings") {
          url = `/api/bookings?search=${q}&status=${statusFilter}&limit=50&t=` + Date.now();
        } else if (activeTab === "leads") {
          url = `/api/leads?search=${q}&status=${statusFilter}&limit=50&t=` + Date.now();
        }
        const res = await fetch(url);
        const data = await res.json();
        if (!ignore) {
          if (activeTab === "tickets") setTickets(data.tickets || []);
          else if (activeTab === "bookings") setBookings(data.bookings || []);
          else if (activeTab === "leads") setLeads(data.leads || []);
          setDataLoading(false);
        }
      } catch {
        if (!ignore) setDataLoading(false);
      }
    }
    loadTabData();
    return () => {
      ignore = true;
    };
  }, [activeTab, statusFilter, priorityFilter, searchQuery]);

  // Optional Polling (every 30 seconds if enabled)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStats();
      fetchTabData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStats, fetchTabData]);

  // Keyboard Escape listener for modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && selectedTicket) {
        setSelectedTicket(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedTicket]);

  const openTicketDetail = (ticket) => {
    setSelectedTicket(ticket);
    setTicketEditForm({
      status: ticket.status || "open",
      priority: ticket.priority || "medium",
      assignedTo: ticket.assignedTo || "",
      resolutionNotes: ticket.resolutionNotes || "",
    });
    setUpdateFeedback(null);
  };

  const handleSaveTicketUpdate = async (e) => {
    e.preventDefault();
    if (!selectedTicket) return;

    setUpdateLoading(true);
    setUpdateFeedback(null);

    try {
      const res = await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.ticketId,
          status: ticketEditForm.status,
          priority: ticketEditForm.priority,
          assignedTo: ticketEditForm.assignedTo,
          resolutionNotes: ticketEditForm.resolutionNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed.");

      setUpdateFeedback({ type: "success", message: "Saved to MongoDB!" });
      setSelectedTicket((prev) => ({
        ...prev,
        ...data.ticket,
      }));

      // Revalidate data
      fetchStats();
      fetchTabData();

      setTimeout(() => {
        setUpdateFeedback(null);
      }, 3000);
    } catch (err) {
      setUpdateFeedback({ type: "error", message: err.message });
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, status: newStatus }),
      });
      if (res.ok) {
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      console.error("Booking update failed:", err);
    }
  };

  const handleUpdateLeadStatus = async (leadId, newStatus) => {
    try {
      const res = await fetch("/api/leads", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, status: newStatus }),
      });
      if (res.ok) {
        fetchStats();
        fetchTabData();
      }
    } catch (err) {
      console.error("Lead update failed:", err);
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-bg-primary">
        <GlowOrb color="violet" size={500} blur={160} opacity={0.06} className="top-10 left-[-150px]" />
        <GlowOrb color="cyan" size={450} blur={150} opacity={0.05} className="top-40 right-[-100px]" />

        <div className="max-w-7xl mx-auto space-y-8">
          {/* Dashboard Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-accent-violet/10 text-accent-violet-light border border-accent-violet/20 flex items-center gap-1.5">
                  <Database className="w-3 h-3 text-accent-cyan" />
                  MongoDB Atlas Operations
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Lock className="w-3 h-3" /> MVP Operator Console
                </span>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-text-primary">
                Customer Operations <span className="gradient-text">Command Center</span>
              </h1>
              <p className="text-sm text-text-secondary mt-1">
                Real-time support tickets, consultation bookings, inbound leads, and human escalation triage.
              </p>
            </div>

            {/* Refresh and Database Controls */}
            <div className="flex flex-wrap items-center gap-3">
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border ${
                  stats?.connected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    stats?.connected ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                  }`}
                />
                <span>
                  {stats?.connected
                    ? `Atlas: Connected (${stats.database})`
                    : "Atlas: Offline (Sample Data Active)"}
                </span>
              </div>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  autoRefresh
                    ? "bg-accent-violet/20 border-accent-violet text-accent-violet-light font-medium"
                    : "bg-white/[0.03] border-border-subtle text-text-muted hover:text-text-primary"
                }`}
              >
                Auto-Refresh: {autoRefresh ? "ON (30s)" : "OFF"}
              </button>

              <button
                onClick={() => {
                  fetchStats();
                  fetchTabData();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-white/[0.04] border border-border-subtle hover:border-accent-violet/40 hover:bg-white/[0.08] text-text-primary transition-colors cursor-pointer"
              >
                <RotateCw className={`w-3.5 h-3.5 ${statsLoading || dataLoading ? "animate-spin" : ""}`} />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>

          {/* 4 Metric Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Bookings */}
            <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted">Total Bookings</span>
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.stats?.totalBookings ?? (statsLoading ? "..." : 0)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                <span>MongoDB Confirmed</span>
                <span className="text-teal-400 font-mono text-[11px]">bookings</span>
              </div>
            </div>

            {/* Open Tickets */}
            <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted">Open Tickets</span>
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                  <TicketCheck className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.stats?.openTickets ?? (statsLoading ? "..." : 0)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                <span>Active Triage</span>
                <span className="text-blue-400 font-mono text-[11px]">tickets</span>
              </div>
            </div>

            {/* Escalated Tickets */}
            <div
              onClick={() => {
                setActiveTab("tickets");
                setStatusFilter("escalated");
              }}
              className="glass-card p-5 rounded-2xl relative overflow-hidden group cursor-pointer border border-rose-500/30 hover:border-rose-500/60 transition-all glow-violet"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-rose-300 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                  Escalated to Human
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-rose-200">
                {stats?.stats?.escalatedTickets ?? (statsLoading ? "..." : 0)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-rose-300/80">
                <span>Urgent Human Queue</span>
                <span className="text-[11px] underline">Filter Queue →</span>
              </div>
            </div>

            {/* Captured Leads */}
            <div className="glass-card p-5 rounded-2xl relative overflow-hidden group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-text-muted">Captured Leads</span>
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-3xl font-bold text-text-primary">
                {stats?.stats?.totalLeads ?? (statsLoading ? "..." : 0)}
              </p>
              <div className="mt-2 flex items-center justify-between text-xs text-text-muted">
                <span>Inbound Opportunities</span>
                <span className="text-purple-400 font-mono text-[11px]">leads</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle pb-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setActiveTab("tickets");
                  setStatusFilter("all");
                  setPriorityFilter("all");
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "tickets"
                    ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                Support Tickets
              </button>

              <button
                onClick={() => {
                  setActiveTab("bookings");
                  setStatusFilter("all");
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "bookings"
                    ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                Bookings & Consultations
              </button>

              <button
                onClick={() => {
                  setActiveTab("leads");
                  setStatusFilter("all");
                }}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "leads"
                    ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                Captured Leads
              </button>

              <button
                onClick={() => setActiveTab("activity")}
                className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "activity"
                    ? "bg-accent-violet text-white shadow-lg shadow-accent-violet/30"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]"
                }`}
              >
                Recent Activity
              </button>
            </div>

            {/* Search Input for Current Tab */}
            {activeTab !== "activity" && (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${activeTab}...`}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-white/[0.03] border border-border-subtle focus:border-accent-violet text-text-primary focus:outline-none placeholder:text-text-muted"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Status Filter Dropdown */}
                {activeTab === "tickets" && (
                  <>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-subtle text-text-primary focus:outline-none"
                    >
                      <option value="all">All Statuses</option>
                      <option value="escalated">🔴 Escalated</option>
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>

                    <select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-subtle text-text-primary focus:outline-none"
                    >
                      <option value="all">All Priorities</option>
                      <option value="urgent">Urgent</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </>
                )}

                {activeTab === "bookings" && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-subtle text-text-primary focus:outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                )}

                {activeTab === "leads" && (
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 text-xs rounded-xl bg-bg-secondary border border-border-subtle text-text-primary focus:outline-none"
                  >
                    <option value="all">All Follow-ups</option>
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="converted">Converted</option>
                    <option value="closed">Closed</option>
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Tab 1: SUPPORT TICKETS TABLE */}
          {activeTab === "tickets" && (
            <div className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-secondary">
                  <thead className="bg-white/[0.02] text-text-muted border-b border-border-subtle uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Ticket ID</th>
                      <th className="px-5 py-3.5">Issue Subject</th>
                      <th className="px-5 py-3.5">Customer</th>
                      <th className="px-5 py-3.5">Priority</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Assignee</th>
                      <th className="px-5 py-3.5">Date</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-violet-light" />
                          Loading live support tickets...
                        </td>
                      </tr>
                    ) : tickets.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          No support tickets matching current filters.
                        </td>
                      </tr>
                    ) : (
                      tickets.map((t) => (
                        <tr
                          key={t.ticketId}
                          className="hover:bg-white/[0.02] transition-colors group cursor-pointer"
                          onClick={() => openTicketDetail(t)}
                        >
                          <td className="px-5 py-4 font-mono font-semibold text-text-primary whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {t.ticketId}
                              {t.channel === "whatsapp" ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-medium">
                                  WhatsApp
                                </span>
                              ) : (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-blue-950/60 text-blue-300 border border-blue-800/60">
                                  Web Chat
                                </span>
                              )}
                              {t.isSample ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-white/[0.06] text-text-muted border border-border-subtle">
                                  Sample Seed
                                </span>
                              ) : (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Live DB
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-text-primary max-w-xs truncate">
                            {t.subject}
                          </td>
                          <td className="px-5 py-4 truncate">{t.customerEmail}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border uppercase ${
                                priorityBadges[t.priority] || priorityBadges.medium
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${
                                statusBadges[t.status] || "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {t.status.replace("_", " ")}
                            </span>
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            {t.assignedTo ? (
                              <span className="text-text-primary">{t.assignedTo}</span>
                            ) : (
                              <span className="text-text-muted italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-text-muted">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openTicketDetail(t);
                              }}
                              className="px-2.5 py-1 text-xs rounded-lg bg-accent-violet/10 hover:bg-accent-violet/20 text-accent-violet-light border border-accent-violet/30 transition-colors inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View / Edit</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: BOOKINGS TABLE */}
          {activeTab === "bookings" && (
            <div className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-secondary">
                  <thead className="bg-white/[0.02] text-text-muted border-b border-border-subtle uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Booking ID</th>
                      <th className="px-5 py-3.5">Customer Name</th>
                      <th className="px-5 py-3.5">Contact Email</th>
                      <th className="px-5 py-3.5">Topic</th>
                      <th className="px-5 py-3.5">Scheduled Slot (UTC)</th>
                      <th className="px-5 py-3.5">Duration</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-violet-light" />
                          Loading consultation bookings...
                        </td>
                      </tr>
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          No bookings matching criteria.
                        </td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.bookingId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-mono font-semibold text-text-primary whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {b.bookingId}
                              {b.isSample ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-white/[0.06] text-text-muted border border-border-subtle">
                                  Sample Seed
                                </span>
                              ) : (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Live DB
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-text-primary">{b.customerName}</td>
                          <td className="px-5 py-4">{b.customerEmail}</td>
                          <td className="px-5 py-4">{b.topic}</td>
                          <td className="px-5 py-4 font-mono text-accent-cyan whitespace-nowrap">
                            {new Date(b.scheduledAt).toLocaleString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              timeZone: "UTC",
                            })}{" "}
                            UTC
                          </td>
                          <td className="px-5 py-4">{b.durationMinutes} mins</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${
                                statusBadges[b.status] || "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            {b.status === "confirmed" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(b.bookingId, "completed")}
                                className="px-2 py-1 text-[11px] rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 transition-colors"
                              >
                                Mark Completed
                              </button>
                            )}
                            {b.status === "completed" && (
                              <span className="text-[11px] text-text-muted">Finished</span>
                            )}
                            {b.status === "cancelled" && (
                              <span className="text-[11px] text-rose-400">Cancelled</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: LEADS TABLE */}
          {activeTab === "leads" && (
            <div className="glass-card rounded-2xl overflow-hidden border border-border-subtle">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-text-secondary">
                  <thead className="bg-white/[0.02] text-text-muted border-b border-border-subtle uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-5 py-3.5">Lead ID</th>
                      <th className="px-5 py-3.5">Contact Name</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Company</th>
                      <th className="px-5 py-3.5">Interest Area</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5">Captured</th>
                      <th className="px-5 py-3.5 text-right">Update Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle">
                    {dataLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          <RotateCw className="w-5 h-5 animate-spin mx-auto mb-2 text-accent-violet-light" />
                          Loading prospect leads...
                        </td>
                      </tr>
                    ) : leads.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-text-muted">
                          No leads captured.
                        </td>
                      </tr>
                    ) : (
                      leads.map((l) => (
                        <tr key={l.leadId} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-mono font-semibold text-text-primary whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              {l.leadId}
                              {l.isSample ? (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-white/[0.06] text-text-muted border border-border-subtle">
                                  Sample Seed
                                </span>
                              ) : (
                                <span className="text-[9px] font-sans px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                  Live DB
                                </span>
                              )}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-text-primary">{l.name}</td>
                          <td className="px-5 py-4">{l.email}</td>
                          <td className="px-5 py-4">{l.company || "—"}</td>
                          <td className="px-5 py-4 max-w-xs truncate">{l.interest}</td>
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border capitalize ${
                                statusBadges[l.status] || "bg-zinc-800 text-zinc-300"
                              }`}
                            >
                              {l.status}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-text-muted whitespace-nowrap">
                            {new Date(l.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-5 py-4 text-right whitespace-nowrap">
                            <select
                              value={l.status}
                              onChange={(e) => handleUpdateLeadStatus(l.leadId, e.target.value)}
                              className="px-2 py-1 text-xs rounded bg-bg-secondary border border-border-subtle text-text-primary"
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="qualified">Qualified</option>
                              <option value="converted">Converted</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: RECENT ACTIVITY TIMELINE */}
          {activeTab === "activity" && (
            <div className="glass-card p-6 rounded-2xl border border-border-subtle space-y-4">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider text-text-muted">
                Real-Time Operations Timeline
              </h3>

              <div className="space-y-3">
                {stats?.recentActivity?.length > 0 ? (
                  stats.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-white/[0.02] border border-border-subtle flex items-start justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            item.type === "escalation"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                              : item.type === "booking"
                              ? "bg-teal-500/20 text-teal-300 border border-teal-500/30"
                              : item.type === "lead"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                          }`}
                        >
                          {item.type === "escalation" ? (
                            <ShieldAlert className="w-4 h-4" />
                          ) : item.type === "booking" ? (
                            <Calendar className="w-4 h-4" />
                          ) : item.type === "lead" ? (
                            <Users className="w-4 h-4" />
                          ) : (
                            <TicketCheck className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-text-primary">{item.title}</p>
                          <p className="text-xs text-text-secondary mt-0.5">{item.subtitle}</p>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                            item.badgeColor === "rose"
                              ? "bg-rose-950 text-rose-300 border-rose-800"
                              : item.badgeColor === "emerald"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                              : "bg-blue-950 text-blue-300 border-blue-800"
                          }`}
                        >
                          {item.badge}
                        </span>
                        <p className="text-[10px] text-text-muted mt-1">
                          {new Date(item.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-text-muted italic py-8 text-center">
                    No recent activity recorded.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* TICKET DETAIL & OPERATOR TRIAGE MODAL */}
        <AnimatePresence>
          {selectedTicket && (
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-ticket-title"
              onClick={(e) => {
                if (e.target === e.currentTarget) setSelectedTicket(null);
              }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-accent shadow-2xl p-6 relative bg-bg-secondary"
              >
                {/* Header */}
                <div className="flex items-start justify-between pb-4 border-b border-border-subtle mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm font-bold text-accent-cyan">
                        {selectedTicket.ticketId}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase border ${
                          statusBadges[selectedTicket.status]
                        }`}
                      >
                        {selectedTicket.status}
                      </span>
                      {selectedTicket.status === "escalated" && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3" /> Urgent Human Triage
                        </span>
                      )}
                    </div>
                    <h3 id="modal-ticket-title" className="text-lg font-bold text-text-primary">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  <button
                    onClick={() => setSelectedTicket(null)}
                    aria-label="Close ticket triage modal"
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-white/[0.04] transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-white/[0.02] border border-border-subtle text-xs">
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Customer Email</span>
                      <span className="font-medium text-text-primary">{selectedTicket.customerEmail}</span>
                    </div>
                    <div>
                      <span className="text-text-muted block text-[10px] uppercase">Category / Source</span>
                      <span className="font-medium text-text-primary capitalize">
                        {selectedTicket.category || "General"} · {selectedTicket.source || "Chat"}
                      </span>
                    </div>
                  </div>

                  {/* Issue Description */}
                  <div>
                    <label className="text-xs font-semibold text-text-muted block mb-1">
                      Issue Description:
                    </label>
                    <div className="p-3.5 rounded-xl bg-white/[0.03] border border-border-subtle text-xs text-text-primary leading-relaxed whitespace-pre-wrap">
                      {selectedTicket.description}
                    </div>
                  </div>

                  {/* Escalation Context (if present) */}
                  {selectedTicket.resolutionNotes && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs">
                      <span className="font-bold text-rose-300 flex items-center gap-1.5 mb-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Escalation Reason & Notes:
                      </span>
                      <p className="text-rose-200/90 whitespace-pre-wrap">
                        {selectedTicket.resolutionNotes}
                      </p>
                    </div>
                  )}

                  {/* Operator Controls Form */}
                  <form onSubmit={handleSaveTicketUpdate} className="pt-2 border-t border-border-subtle space-y-3">
                    <p className="text-xs font-bold text-text-primary uppercase tracking-wider">
                      Operator Controls & Status Triage
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-text-muted block mb-1">Update Status:</label>
                        <select
                          value={ticketEditForm.status}
                          onChange={(e) =>
                            setTicketEditForm({ ...ticketEditForm, status: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-bg-tertiary border border-border-subtle text-text-primary focus:border-accent-violet focus:outline-none"
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="escalated">🔴 Escalated (Human Support Required)</option>
                          <option value="resolved">Resolved</option>
                          <option value="closed">Closed</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs text-text-muted block mb-1">Assign Operator:</label>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Jenkins (Tier-2)"
                          value={ticketEditForm.assignedTo}
                          onChange={(e) =>
                            setTicketEditForm({ ...ticketEditForm, assignedTo: e.target.value })
                          }
                          className="w-full px-3 py-2 text-xs rounded-xl bg-bg-tertiary border border-border-subtle text-text-primary focus:border-accent-violet focus:outline-none placeholder:text-text-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-text-muted block mb-1">Resolution / Triage Notes:</label>
                      <textarea
                        rows={2}
                        placeholder="Add internal troubleshooting steps or resolution summary..."
                        value={ticketEditForm.resolutionNotes}
                        onChange={(e) =>
                          setTicketEditForm({ ...ticketEditForm, resolutionNotes: e.target.value })
                        }
                        className="w-full px-3 py-2 text-xs rounded-xl bg-bg-tertiary border border-border-subtle text-text-primary focus:border-accent-violet focus:outline-none placeholder:text-text-muted resize-none"
                      />
                    </div>

                    {updateFeedback && (
                      <div
                        className={`text-xs p-2 rounded-lg ${
                          updateFeedback.type === "success"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-rose-500/20 text-rose-300"
                        }`}
                      >
                        {updateFeedback.message}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTicket(null)}
                      >
                        Close
                      </Button>

                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                        disabled={updateLoading}
                        icon={<Save className="w-3.5 h-3.5" />}
                      >
                        {updateLoading ? "Saving to MongoDB..." : "Save Triage Changes"}
                      </Button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}
