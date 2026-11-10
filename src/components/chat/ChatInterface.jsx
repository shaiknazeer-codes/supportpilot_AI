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
  Plus,
  Minus,
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

function cleanMessageText(text) {
  if (!text || typeof text !== "string") return "";
  return text.replace(/\*\*/g, "").replace(/\*/g, "");
}

const SUGGESTED_PROMPTS = [
  {
    title: "🏥 Book an Appointment",
    prompt: "I want to book an appointment",
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

const CINEMA_SEAT_ROWS = [
  {
    row: "F",
    tier: "VIP Recliner",
    seats: [
      { id: "F1", status: "booked" },
      { id: "F2", status: "available" },
      { id: "F3", status: "available" },
      { id: "F4", status: "available" },
      { id: "F5", status: "available" },
      { id: "F6", status: "available" },
      { id: "F7", status: "available" },
      { id: "F8", status: "available" },
    ],
  },
  {
    row: "E",
    tier: "Prime Club",
    seats: [
      { id: "E1", status: "available" },
      { id: "E2", status: "available" },
      { id: "E3", status: "available" },
      { id: "E4", status: "available" },
      { id: "E5", status: "available" },
      { id: "E6", status: "available" },
      { id: "E7", status: "available" },
      { id: "E8", status: "available" },
    ],
  },
  {
    row: "D",
    tier: "Gold Executive",
    seats: [
      { id: "D1", status: "booked" },
      { id: "D2", status: "booked" },
      { id: "D3", status: "available" },
      { id: "D4", status: "available" },
      { id: "D5", status: "available" },
      { id: "D6", status: "available" },
      { id: "D7", status: "available" },
      { id: "D8", status: "available" },
    ],
  },
  {
    row: "C",
    tier: "Gold Executive",
    seats: [
      { id: "C1", status: "available" },
      { id: "C2", status: "available" },
      { id: "C3", status: "available" },
      { id: "C4", status: "available" },
      { id: "C5", status: "available" },
      { id: "C6", status: "available" },
      { id: "C7", status: "booked" },
      { id: "C8", status: "available" },
    ],
  },
  {
    row: "B",
    tier: "Silver Standard",
    seats: [
      { id: "B1", status: "available" },
      { id: "B2", status: "available" },
      { id: "B3", status: "available" },
      { id: "B4", status: "booked" },
      { id: "B5", status: "booked" },
      { id: "B6", status: "available" },
      { id: "B7", status: "available" },
      { id: "B8", status: "available" },
    ],
  },
  {
    row: "A",
    tier: "Silver Standard",
    seats: [
      { id: "A1", status: "booked" },
      { id: "A2", status: "booked" },
      { id: "A3", status: "available" },
      { id: "A4", status: "available" },
      { id: "A5", status: "available" },
      { id: "A6", status: "available" },
      { id: "A7", status: "available" },
      { id: "A8", status: "available" },
    ],
  },
];

function MovieShowtimesInteractive({ result, onSelectSlot, onFillInput }) {
  const [selectedDate, setSelectedDate] = useState("Today");
  const [selectedTheater, setSelectedTheater] = useState(null);
  const [selectedTiming, setSelectedTiming] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(["E4", "E5"]);
  const seatMapPanelRef = useRef(null);

  const dates = [
    { id: "Today", label: "Today (Mon, 9 Nov)" },
    { id: "Tomorrow", label: "Tomorrow (Tue, 10 Nov)" },
    { id: "Wednesday", label: "Wed, 11 Nov" },
  ];

  const handleTimingClick = (theaterName, timing) => {
    setSelectedTheater(theaterName);
    setSelectedTiming(timing);
    setTimeout(() => {
      seatMapPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const handleSeatClick = (seatId, isBooked) => {
    if (isBooked) return;
    setSelectedSeats((prev) => {
      if (prev.includes(seatId)) {
        return prev.filter((id) => id !== seatId);
      } else {
        return [...prev, seatId].sort();
      }
    });
  };

  const selectedTheaterObj = result.theaters?.find((t) => t.name === selectedTheater);
  const unitPrice = parseInt((selectedTheaterObj?.price || "₹250").replace(/[^\d]/g, ""), 10) || 250;
  const count = selectedSeats.length > 0 ? selectedSeats.length : 1;
  const totalPrice = unitPrice * count;

  const handleConfirm = () => {
    if (!selectedTheater || !selectedTiming) return;
    const seatsStr = selectedSeats.length > 0 ? selectedSeats.join(", ") : "E4, E5";
    const prompt = `Please book seats ${seatsStr} (${count} tickets) for ${result.movie} at ${selectedTheater} on ${selectedDate} at ${selectedTiming}. Confirm booking.`;
    if (onSelectSlot) onSelectSlot(prompt);
  };

  const handleEditInChat = () => {
    if (!selectedTheater || !selectedTiming) return;
    const seatsStr = selectedSeats.length > 0 ? selectedSeats.join(", ") : "E4, E5";
    const prompt = `Book seats ${seatsStr} for ${result.movie} at ${selectedTheater} on ${selectedDate} at ${selectedTiming}`;
    if (onFillInput) onFillInput(prompt);
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-accent-cyan/10 border border-accent-cyan/30 text-xs text-text-primary">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-accent-cyan-light">
          <Film className="w-4 h-4 text-accent-cyan" />
          <span>{result.movie} — Indore Showtimes</span>
        </div>
        {result.rating && (
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-text-secondary">
            {result.rating} · {result.duration}
          </span>
        )}
      </div>

      {/* 📅 Date Selection Row */}
      <div className="mb-3">
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1.5">
          Select Date:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {dates.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDate(d.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedDate === d.id
                  ? "bg-accent-cyan text-bg-primary font-bold shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-text-secondary border border-white/10"
              }`}
            >
              📅 {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theaters and Showtimes */}
      <div className="space-y-2.5">
        {result.theaters?.map((t) => (
          <div
            key={t.name}
            className={`p-2.5 rounded-lg border transition-all ${
              selectedTheater === t.name
                ? "bg-accent-cyan/15 border-accent-cyan/50"
                : "bg-bg-primary/90 border-border-subtle"
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="font-semibold text-text-primary flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-accent-violet-light" />
                  {t.name}
                </span>
                <span className="text-[10px] text-text-muted block">{t.location}</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-mono font-medium border border-emerald-500/20">
                    🟢 {t.availableSeats || 48} seats available
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    Total: {t.totalSeats || 90}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[12px] font-mono font-bold text-emerald-400 block">
                  {t.price}
                </span>
                <span className="text-[9px] text-text-muted">per ticket</span>
              </div>
            </div>

            {/* Timing Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {t.timings?.map((timing) => {
                const isSelected = selectedTheater === t.name && selectedTiming === timing;
                return (
                  <button
                    key={timing}
                    type="button"
                    onClick={() => handleTimingClick(t.name, timing)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98] ${
                      isSelected
                        ? "bg-accent-cyan text-bg-primary font-bold shadow-[0_0_10px_#06b6d4]"
                        : "bg-accent-cyan/15 hover:bg-accent-cyan/30 text-accent-cyan-light hover:text-white border border-accent-cyan/30"
                    }`}
                    title="Click to select this showtime"
                  >
                    <span>🕒 {timing}</span>
                  </button>
                );
              })}
              <span className="text-[10px] text-text-muted ml-auto font-mono">
                {t.formats?.join(" · ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 💺 Interactive Seat Selection Grid */}
      {selectedTiming && selectedTheater && (
        <div ref={seatMapPanelRef} className="mt-3.5 p-3.5 rounded-xl bg-bg-primary/95 border border-accent-cyan/40">
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent-cyan-light block">
                Choose Your Seats
              </span>
              <span className="text-[11px] text-text-secondary block">
                Tap available seats to pick your preferred spots
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                {selectedSeats.length} Selected
              </span>
            </div>
          </div>

          {/* Curved Cinema Screen */}
          <div className="w-full flex flex-col items-center my-2.5">
            <div className="w-4/5 h-1.5 bg-gradient-to-r from-transparent via-accent-cyan to-transparent rounded-full shadow-[0_0_12px_#06b6d4]" />
            <span className="text-[8px] uppercase tracking-widest text-accent-cyan/80 font-mono mt-1 font-semibold">
              CINEMA SCREEN (All Eyes This Way)
            </span>
          </div>

          {/* Seat Layout Rows */}
          <div className="space-y-1.5 my-3">
            {CINEMA_SEAT_ROWS.map((rowObj) => (
              <div key={rowObj.row} className="flex items-center justify-center gap-1 text-[10px]">
                <span className="w-5 text-right font-mono font-bold text-text-muted mr-1">
                  {rowObj.row}
                </span>

                <div className="flex items-center gap-1">
                  {rowObj.seats.map((seat, seatIdx) => {
                    const isBooked = seat.status === "booked";
                    const isSelected = selectedSeats.includes(seat.id);

                    return (
                      <button
                        key={seat.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => handleSeatClick(seat.id, isBooked)}
                        title={
                          isBooked
                            ? `Seat ${seat.id} (Booked / Sold Out)`
                            : `Seat ${seat.id} (${rowObj.tier}) - Click to select`
                        }
                        className={`w-6 h-6 rounded flex items-center justify-center font-mono text-[9px] transition-all cursor-pointer ${
                          seatIdx === 3 ? "mr-2.5" : ""
                        } ${
                          isBooked
                            ? "bg-white/5 border border-white/5 text-text-muted/20 cursor-not-allowed"
                            : isSelected
                            ? "bg-gradient-to-br from-accent-cyan to-emerald-400 text-bg-primary font-bold border border-cyan-200 shadow-[0_0_8px_#06b6d4] scale-105"
                            : "bg-white/5 hover:bg-accent-cyan/20 border border-white/10 hover:border-accent-cyan/40 text-text-secondary hover:text-white"
                        }`}
                      >
                        {isBooked ? "✕" : seat.id.slice(1)}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Seat Map Legend */}
          <div className="flex items-center justify-center gap-4 pt-2 border-t border-white/10 text-[10px] text-text-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/10 border border-white/20" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-accent-cyan border border-cyan-300 shadow-[0_0_6px_#06b6d4]" />
              <span className="text-accent-cyan-light font-medium">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-white/5 border border-white/5 text-text-muted/30 flex items-center justify-center text-[7px]">
                ✕
              </div>
              <span>Sold Out</span>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation & Action Panel */}
      {selectedTiming && selectedTheater && (
        <div className="mt-3 p-3.5 rounded-xl bg-gradient-to-r from-accent-violet/20 to-accent-cyan/20 border border-accent-cyan/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-accent-cyan-light block">
                Selected Reservation
              </span>
              <p className="text-xs font-semibold text-white mt-0.5">
                {result.movie} · {selectedTheater}
              </p>
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                📅 {selectedDate} at {selectedTiming}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] text-text-muted">Seats:</span>
                <span className="text-[11px] font-mono font-bold text-accent-cyan">
                  {selectedSeats.length > 0 ? selectedSeats.join(", ") : "None chosen"}
                </span>
                <span className="text-[10px] text-text-muted">({count} Ticket{count > 1 ? "s" : ""})</span>
              </div>
            </div>

            {/* Total Price and Action Buttons */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right mr-1">
                <span className="text-[9px] text-text-muted block">Total Amount</span>
                <span className="text-sm font-mono font-bold text-emerald-300">
                  ₹{totalPrice}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedSeats.length === 0}
                  onClick={handleConfirm}
                  className={`px-3 py-1.5 rounded-lg text-white text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 ${
                    selectedSeats.length === 0
                      ? "bg-slate-700 opacity-50 cursor-not-allowed"
                      : "bg-gradient-to-r from-accent-violet to-accent-cyan hover:opacity-90 cursor-pointer"
                  }`}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  Confirm & Book
                </button>
                <button
                  type="button"
                  onClick={handleEditInChat}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all cursor-pointer"
                  title="Populate chat box to edit seat details"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HospitalConsultationInteractive({ result, onSelectSlot, onFillInput }) {
  const specialties = result.specialties || [
    { id: "dermatology", name: "Dermatology / Skin Specialist", shortName: "Skin Doctor" },
    { id: "cardiology", name: "Cardiology / Heart Specialist", shortName: "Heart Doctor" },
    { id: "orthopedics", name: "Orthopedics / Bone & Joint Specialist", shortName: "Bone & Joint" },
    { id: "general-medicine", name: "General Medicine / Physician", shortName: "General Physician" },
    { id: "neurology", name: "Neurology / Brain & Nerve Specialist", shortName: "Neurologist" },
    { id: "pediatrics", name: "Pediatrics / Child Specialist", shortName: "Child Doctor" },
    { id: "gynecology", name: "Gynecology & Obstetrics / Women's Health", shortName: "Women's Health" },
    { id: "ent", name: "ENT / Ear, Nose & Throat", shortName: "ENT Specialist" },
    { id: "ophthalmology", name: "Ophthalmology / Eye Specialist", shortName: "Eye Doctor" },
    { id: "dental", name: "Dental Surgery / Dentist", shortName: "Dentist" },
  ];

  const [selectedSpecialty, setSelectedSpecialty] = useState(
    result.selectedSpecialty || null
  );
  const [selectedHospital, setSelectedHospital] = useState(
    result.hospital || (result.hospitals && result.hospitals[0]?.name) || "Bombay Hospital Indore"
  );
  const [selectedDate, setSelectedDate] = useState(result.requestedDay || "Tomorrow");
  const [selectedTiming, setSelectedTiming] = useState(null);

  const dates = [
    { id: "Today", label: "Today (Mon, 9 Nov)" },
    { id: "Tomorrow", label: "Tomorrow (Tue, 10 Nov)" },
    { id: "Wednesday", label: "Wed, 11 Nov" },
    { id: "Thursday", label: "Thu, 12 Nov" },
  ];

  const currentHospitalObj = result.hospitals?.find((h) => h.name === selectedHospital) || result.hospitals?.[0] || {
    name: "Bombay Hospital Indore",
    location: "Ring Road, Scheme No. 94C, Near Velocity III, Indore",
    fee: "₹700",
    timings: ["09:30 AM", "11:15 AM", "01:30 PM", "04:30 PM", "06:45 PM"],
    departments: ["Dermatology / Skin Specialist", "Cardiology / Heart Specialist", "Orthopedics / Bone & Joint Specialist"],
    doctors: {
      "Dermatology / Skin Specialist": "Dr. Ananya Dixit (Senior Dermatologist)",
      "Cardiology / Heart Specialist": "Dr. Vivek Jain (Chief Cardiologist)",
    },
  };

  let doctorName = "Specialist Consultant";
  if (currentHospitalObj.doctors) {
    if (selectedSpecialty) {
      const matchKey = Object.keys(currentHospitalObj.doctors).find(
        (k) =>
          k.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
          selectedSpecialty.toLowerCase().includes(k.toLowerCase())
      );
      doctorName = matchKey ? currentHospitalObj.doctors[matchKey] : Object.values(currentHospitalObj.doctors)[0];
    } else {
      doctorName = Object.values(currentHospitalObj.doctors)[0] || "Specialist Consultant";
    }
  }

  const confirmPanelRef = useRef(null);

  const handleTimingClick = (hospName, timing) => {
    setSelectedHospital(hospName);
    setSelectedTiming(timing);
    if (!selectedSpecialty) {
      setSelectedSpecialty("General Medicine / Physician");
    }
    setTimeout(() => {
      confirmPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 80);
  };

  const handleSpecialtyClick = (specName) => {
    setSelectedSpecialty(specName);
    if (result.hospitals) {
      const matchHosp = result.hospitals.find((h) =>
        h.departments?.some((d) => d.toLowerCase().includes(specName.toLowerCase()))
      );
      if (matchHosp) {
        setSelectedHospital(matchHosp.name);
      }
    }
  };

  const handleConfirm = () => {
    if (!selectedHospital || !selectedTiming) return;
    const specialtyText = selectedSpecialty || "General Medicine / Physician";
    const prompt = `Please book a consultation with ${doctorName} (${specialtyText}) at ${selectedHospital} on ${selectedDate} at ${selectedTiming}. Confirm booking.`;
    if (onSelectSlot) onSelectSlot(prompt);
  };

  const handleEditInChat = () => {
    if (!selectedHospital || !selectedTiming) return;
    const specialtyText = selectedSpecialty || "General Medicine / Physician";
    const prompt = `Book appointment with ${doctorName} for ${specialtyText} at ${selectedHospital} on ${selectedDate} at ${selectedTiming}`;
    if (onFillInput) onFillInput(prompt);
  };

  return (
    <div className="mt-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-text-primary">
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-300">
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Indore Healthcare Network — Specialist Appointments</span>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
          Indore, MP
        </span>
      </div>

      {/* 🩺 Medical Field / Specialty Selector */}
      <div className="mb-3">
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1.5">
          Select Medical Field / Specialty:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {specialties.map((s) => {
            const isSelected =
              Boolean(selectedSpecialty) &&
              (selectedSpecialty.toLowerCase().includes(s.shortName.toLowerCase()) ||
                selectedSpecialty.toLowerCase() === s.name.toLowerCase());
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSpecialtyClick(s.name)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                  isSelected
                    ? "bg-emerald-500 text-bg-primary font-bold shadow-md scale-102"
                    : "bg-white/5 hover:bg-white/10 text-text-secondary border border-white/10 hover:text-white"
                }`}
              >
                <span>{s.shortName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 📅 Date Selection Row */}
      <div className="mb-3">
        <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold block mb-1.5">
          Select Date:
        </span>
        <div className="flex items-center gap-1.5 flex-wrap">
          {dates.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDate(d.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer ${
                selectedDate === d.id
                  ? "bg-accent-cyan text-bg-primary font-bold shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-text-secondary border border-white/10"
              }`}
            >
              📅 {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* 🏥 Indore Hospital Cards with Specialist and Timing Slots */}
      <div className="space-y-2.5">
        {(result.hospitals || [currentHospitalObj]).map((h) => {
          const isHospSelected = selectedHospital === h.name;
          const docKey = selectedSpecialty && h.doctors
            ? Object.keys(h.doctors).find((k) =>
                k.toLowerCase().includes(selectedSpecialty.toLowerCase()) ||
                selectedSpecialty.toLowerCase().includes(k.toLowerCase())
              )
            : null;
          const assignedDoc = docKey && h.doctors ? h.doctors[docKey] : Object.values(h.doctors || {})[0] || "Specialist Consultant";

          return (
            <div
              key={h.name}
              className={`p-2.5 rounded-lg border transition-all ${
                isHospSelected
                  ? "bg-emerald-500/15 border-emerald-500/50"
                  : "bg-bg-primary/90 border-border-subtle"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <span className="font-semibold text-text-primary flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                    {h.name}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">{h.location}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-cyan/15 text-accent-cyan-light font-mono font-medium border border-accent-cyan/20">
                      🩺 {assignedDoc}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[12px] font-mono font-bold text-emerald-300 block">
                    {h.fee || h.consultationFee || "₹700"}
                  </span>
                  <span className="text-[9px] text-text-muted">Consultation Fee</span>
                </div>
              </div>

              {/* Timing Slots */}
              <div className="flex items-center gap-1.5 flex-wrap mt-2">
                <span className="text-[10px] text-text-muted mr-1 font-medium">Slots:</span>
                {(h.timings || ["09:30 AM", "11:15 AM", "02:00 PM", "04:30 PM", "06:45 PM"]).map((timing) => {
                  const isTimingSelected = isHospSelected && selectedTiming === timing;
                  return (
                    <button
                      key={timing}
                      type="button"
                      onClick={() => handleTimingClick(h.name, timing)}
                      className={`px-2 py-1 rounded text-[10px] font-mono transition-all cursor-pointer flex items-center gap-1 active:scale-[0.98] ${
                        isTimingSelected
                          ? "bg-emerald-500 text-bg-primary font-bold shadow-[0_0_8px_#10b981]"
                          : "bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 hover:text-white border border-emerald-500/30"
                      }`}
                      title="Click to select this consultation slot"
                    >
                      <span>🕒 {timing}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 📋 Confirmation & Action Panel */}
      {selectedTiming && selectedHospital && (
        <div ref={confirmPanelRef} className="mt-3.5 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-accent-cyan/20 border border-emerald-500/40">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                Selected Appointment
              </span>
              <p className="text-xs font-semibold text-white mt-0.5">
                {doctorName} {selectedSpecialty ? `· ${selectedSpecialty}` : ""}
              </p>
              <p className="text-[11px] text-text-muted mt-0.5">
                {selectedHospital}
              </p>
              <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                📅 {selectedDate} at {selectedTiming}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right mr-1">
                <span className="text-[9px] text-text-muted block">Fee</span>
                <span className="text-sm font-mono font-bold text-emerald-300">
                  {currentHospitalObj.fee || currentHospitalObj.consultationFee || "₹700"}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg hover:opacity-90 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  Confirm & Book
                </button>
                <button
                  type="button"
                  onClick={handleEditInChat}
                  className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-medium transition-all cursor-pointer"
                  title="Populate chat box to edit consultation details"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Renders structured operational action badges and cards confirming real backend tool executions.
 */
function ActionCard({ action, onSelectSlot, onFillInput }) {
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

    if (success && (result?.hospitals || result?.hospital)) {
      return (
        <HospitalConsultationInteractive
          result={result}
          onSelectSlot={onSelectSlot}
          onFillInput={onFillInput}
        />
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
              <span>Appointment Confirmed · Consultation Reserved</span>
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
              {result.doctor && (
                <div className="col-span-2">
                  <span className="text-text-secondary font-medium">Doctor: </span>
                  <span className="text-accent-cyan-light font-medium">{result.doctor}</span>
                </div>
              )}
              <div>
                <span className="text-text-secondary font-medium">Patient: </span>
                {result.customerName}
              </div>
              <div>
                <span className="text-text-secondary font-medium">Email: </span>
                {result.customerEmail}
              </div>
              {result.consultationFee && (
                <div>
                  <span className="text-text-secondary font-medium">Fee: </span>
                  <span className="text-emerald-300 font-mono font-bold">{result.consultationFee}</span>
                </div>
              )}
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

    // Stage 1: Movies List (Clickable to immediately load Indore showtimes)
    if (result?.movies && result.movies.length > 0) {
      return (
        <div className="mt-3 p-3.5 rounded-xl bg-accent-violet/10 border border-accent-violet/30 text-xs text-text-primary">
          <div className="flex items-center gap-2 mb-2 font-semibold text-accent-violet-light">
            <Film className="w-4 h-4 text-accent-cyan" />
            <span>Currently Screening in Indore (BookMyShow)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-accent-violet/20 text-accent-violet-light ml-auto">
              Live Catalog
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            {result.movies.map((m) => (
              <button
                key={m.title}
                type="button"
                onClick={() => onSelectSlot && onSelectSlot(`Show showtimes for ${m.title} in Indore`)}
                className="p-2.5 rounded-lg bg-bg-primary/80 hover:bg-accent-violet/20 border border-white/5 hover:border-accent-violet/40 active:scale-[0.98] transition-all text-left flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <span className="font-semibold text-text-primary group-hover:text-accent-cyan text-[12px] block">
                    {m.title}
                  </span>
                  <span className="text-[10px] text-text-muted block mt-0.5">
                    {m.genre} · {m.duration} · {m.rating}
                  </span>
                </div>
                <div className="mt-2 text-[10px] text-accent-cyan flex items-center justify-between">
                  <span>{m.theatersAvailable?.length || 3} Indore Venues</span>
                  <span className="text-accent-violet-light group-hover:underline font-medium">View Shows →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Stage 2 & 3: Theaters and Showtimes with Interactive Date & Time Buttons
    if (result?.theaters && result.theaters.length > 0) {
      return (
        <MovieShowtimesInteractive
          result={result}
          onSelectSlot={onSelectSlot}
          onFillInput={onFillInput}
        />
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
              <span>Ticket Confirmed · Enjoy Your Movie!</span>
            </div>
            <span className="font-mono text-[11px] px-2.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-600 font-bold">
              {result.bookingId}
            </span>
          </div>

          <div className="space-y-1.5 mt-2">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-bold text-text-primary tracking-tight">
                {result.movie}
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
              <span>Support Ticket Created</span>
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
  const latestMessageRef = useRef(null);

  // Keep window at top when entering /chat page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const scrollToLatestMessage = () => {
    if (!messagesContainerRef.current) return;
    if (latestMessageRef.current) {
      const container = messagesContainerRef.current;
      const targetTop = Math.max(0, latestMessageRef.current.offsetTop - 16);
      container.scrollTo({
        top: targetTop,
        behavior: "smooth",
      });
    } else {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const formatTimestamp = (date) => {
    if (!mounted) return "";
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    }).format(date ? new Date(date) : new Date());
  };

  const handleSendMessage = async (textToSend, options = {}) => {
    const content = (textToSend || input).trim();
    if (!content || isLoading) return;

    setErrorState(null);
    setInput("");

    const isFollowUp = messages.length > 0;
    const shouldScroll = Boolean(isFollowUp || options.autoScroll);

    const userMessage = {
      id: createMessageId("user"),
      role: "user",
      content: content,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);

    if (shouldScroll) {
      setTimeout(scrollToBottom, 50);
    }

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

        if (shouldScroll) {
          setTimeout(scrollToLatestMessage, 100);
          setTimeout(scrollToLatestMessage, 350);
        }
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
    }
  };

  const handleSelectSlot = (promptOrIso, date) => {
    if (typeof promptOrIso === "string" && (promptOrIso.includes("book") || promptOrIso.includes("showtimes") || promptOrIso.includes("ticket") || promptOrIso.includes("consultation") || promptOrIso.includes("appointment") || !date)) {
      handleSendMessage(promptOrIso, { autoScroll: true });
      return;
    }
    const timeFormatted = new Date(promptOrIso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });
    handleSendMessage(`I'd like to book the ${timeFormatted} UTC slot on ${date}. Please confirm my appointment.`, { autoScroll: true });
  };

  const handleFillInput = (text) => {
    setInput(text);
    setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 50);
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
        {messages.map((message, index) => {
          const isUser = message.role === "user";
          const isLast = index === messages.length - 1;
          return (
            <motion.div
              key={message.id}
              ref={isLast ? latestMessageRef : null}
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
                  {cleanMessageText(message.content)}
                </div>

                {/* Render Structured Tool Action Badges */}
                {message.toolActions && message.toolActions.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {message.toolActions.map((action, i) => (
                      <ActionCard
                        key={i}
                        action={action}
                        onSelectSlot={handleSelectSlot}
                        onFillInput={handleFillInput}
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
        </div>
      </div>
    </div>
  );
}
