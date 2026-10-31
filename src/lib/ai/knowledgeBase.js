/**
 * Comprehensive Movie Showtimes & Theaters Catalog.
 * Used by SupportPilot AI for conversational movie ticket booking.
 */
export const MOVIE_CATALOG = [
  {
    id: "dune-2",
    title: "Dune: Part Two",
    genre: "Sci-Fi / Adventure",
    duration: "166 mins",
    rating: "PG-13",
    language: "English (IMAX & Dolby Atmos)",
    theaters: [
      {
        name: "Downtown IMAX Cinema",
        location: "Downtown Center, Mall Level 3",
        timings: ["10:30 AM", "02:15 PM", "06:00 PM", "09:30 PM"],
        formats: ["IMAX 4K", "Dolby Atmos"],
        price: "$18.50",
      },
      {
        name: "Grand Plaza Multiplex",
        location: "Westside Boulevard, Gate 2",
        timings: ["11:00 AM", "03:30 PM", "07:15 PM", "10:45 PM"],
        formats: ["2D Digital", "3D"],
        price: "$14.00",
      },
      {
        name: "CineStar Luxury Lounge",
        location: "Midtown Heights, Tower A",
        timings: ["01:00 PM", "05:00 PM", "08:45 PM"],
        formats: ["VIP Recliner", "Dine-in"],
        price: "$24.00",
      },
    ],
  },
  {
    id: "inception",
    title: "Inception (15th Anniversary Re-Release)",
    genre: "Sci-Fi / Action Thriller",
    duration: "148 mins",
    rating: "PG-13",
    language: "English",
    theaters: [
      {
        name: "Downtown IMAX Cinema",
        location: "Downtown Center, Mall Level 3",
        timings: ["11:15 AM", "03:45 PM", "07:30 PM", "10:30 PM"],
        formats: ["IMAX 70mm", "Dolby Audio"],
        price: "$19.00",
      },
      {
        name: "PVR Orion Megaplex",
        location: "North Avenue Mall, 4th Floor",
        timings: ["12:00 PM", "04:30 PM", "08:15 PM"],
        formats: ["4DX", "2D Digital"],
        price: "$16.50",
      },
    ],
  },
  {
    id: "deadpool-wolverine",
    title: "Deadpool & Wolverine",
    genre: "Action / Comedy / Superhero",
    duration: "128 mins",
    rating: "R",
    language: "English",
    theaters: [
      {
        name: "Grand Plaza Multiplex",
        location: "Westside Boulevard, Gate 2",
        timings: ["10:00 AM", "01:15 PM", "04:45 PM", "08:00 PM", "11:15 PM"],
        formats: ["3D Digital", "2D Digital"],
        price: "$15.00",
      },
      {
        name: "PVR Orion Megaplex",
        location: "North Avenue Mall, 4th Floor",
        timings: ["11:30 AM", "02:45 PM", "06:15 PM", "09:45 PM"],
        formats: ["IMAX 3D", "4DX"],
        price: "$18.00",
      },
      {
        name: "CineStar Luxury Lounge",
        location: "Midtown Heights, Tower A",
        timings: ["02:00 PM", "06:30 PM", "10:00 PM"],
        formats: ["VIP Recliner"],
        price: "$24.00",
      },
    ],
  },
  {
    id: "interstellar",
    title: "Interstellar",
    genre: "Sci-Fi / Adventure / Drama",
    duration: "169 mins",
    rating: "PG-13",
    language: "English",
    theaters: [
      {
        name: "Downtown IMAX Cinema",
        location: "Downtown Center, Mall Level 3",
        timings: ["10:00 AM", "01:45 PM", "05:30 PM", "09:15 PM"],
        formats: ["IMAX 70mm Special Screening"],
        price: "$20.00",
      },
      {
        name: "CineStar Luxury Lounge",
        location: "Midtown Heights, Tower A",
        timings: ["03:15 PM", "07:45 PM"],
        formats: ["VIP Recliner Dolby"],
        price: "$25.00",
      },
    ],
  },
  {
    id: "gladiator-2",
    title: "Gladiator II",
    genre: "Action / Drama / Epic",
    duration: "148 mins",
    rating: "R",
    language: "English",
    theaters: [
      {
        name: "Grand Plaza Multiplex",
        location: "Westside Boulevard, Gate 2",
        timings: ["11:45 AM", "03:15 PM", "06:45 PM", "10:15 PM"],
        formats: ["Dolby Cinema", "2D Digital"],
        price: "$16.00",
      },
      {
        name: "PVR Orion Megaplex",
        location: "North Avenue Mall, 4th Floor",
        timings: ["01:00 PM", "05:15 PM", "08:45 PM"],
        formats: ["ScreenX", "Atmos"],
        price: "$17.50",
      },
    ],
  },
];

/**
 * Editable FAQ Knowledge Base for SupportPilot AI.
 * Supplies ground-truth operational facts for customer inquiries.
 */
export const KNOWLEDGE_BASE = {
  organization: {
    name: "SupportPilot AI",
    tagline: "Listen. Understand. Act. Resolve.",
    description:
      "SupportPilot AI is an autonomous customer operations platform that manages multi-channel support inquiries, movie ticket bookings, schedules appointments, logs support tickets, captures leads, and escalates complex issues to human specialists.",
  },
  operatingHours: {
    days: "Monday through Sunday (24/7 Operations)",
    hours: "Cinema Booking: 24/7 Available. Consultations: Mon-Fri 9:00 AM to 5:00 PM UTC",
    standardSlotDurations: "30 minutes or 45 minutes",
    timezone: "UTC",
  },
  movieTicketingService: {
    description:
      "Full-cycle automated movie ticket booking across premier cinema chains.",
    workflowRules: [
      "Step 1: When a customer asks to book a ticket, ask which movie they want to watch and list currently showing movies.",
      "Step 2: Once the movie is chosen, show the exact cinema locations/theaters where that movie is available.",
      "Step 3: Once the customer selects a cinema/location, show the available show timings and formats (e.g. 10:30 AM, 02:15 PM, 06:00 PM, 09:30 PM).",
      "Step 4: Ask for the number of seats/tickets, customer name, and email. Provide a clear booking summary.",
      "Step 5: When the customer confirms, execute the booking via bookMovieTicket/createBooking and return a confirmed Booking ID (BK-MOV-XXXXXX).",
    ],
    availableMovies: MOVIE_CATALOG.map((m) => ({
      title: m.title,
      genre: m.genre,
      duration: m.duration,
      rating: m.rating,
      theatersCount: m.theaters.length,
      theaters: m.theaters.map((t) => t.name),
    })),
  },
  servicesAndCapabilities: [
    {
      capability: "Movie Ticket Booking",
      details:
        "Automated movie selection, cinema location lookup, showtime selection, seat reservation, and persistent MongoDB ticket storage with instant confirmation.",
    },
    {
      capability: "AI Support Chat",
      details:
        "Instant, context-aware answers to customer questions 24/7, with zero human latency.",
    },
    {
      capability: "Automated Appointment Booking",
      details:
        "Live calendar slot validation and direct persistence to MongoDB. Enforces double-booking prevention and requires explicit customer confirmation.",
    },
    {
      capability: "Ticket Management & Triage",
      details:
        "Automatic creation, priority classification (Low, Medium, High, Urgent), and categorization (General, Billing, Technical, Account, Feature Request).",
    },
    {
      capability: "Human Escalation",
      details:
        "Seamless transfer of unresolved, sensitive, or high-priority customer requests to human staff. Sets status to 'escalated' in the triage queue for review.",
    },
    {
      capability: "Lead Capture",
      details:
        "Intelligent extraction and persistent recording of prospective customer contact details and interest areas.",
    },
  ],
  serviceLevelAgreements: {
    aiResponseTime: "Under 2 seconds",
    escalatedTicketTriage: "High priority tickets reviewed by human agents within 2 business hours",
    standardTicketResolution: "Within 24 business hours",
  },
  faqs: [
    {
      question: "How do I book movie tickets?",
      answer:
        "Just say 'I want to book a ticket'. We will ask for your movie, show you available theater locations, present showtimes, ask for your seat count, and confirm your booking directly in MongoDB with a unique booking ID.",
    },
    {
      question: "What movies are currently showing?",
      answer:
        "Currently screening: Dune: Part Two, Inception (15th Anniversary Re-Release), Deadpool & Wolverine, Interstellar, and Gladiator II across Downtown IMAX, Grand Plaza Multiplex, CineStar Luxury Lounge, and PVR Orion Megaplex.",
    },
    {
      question: "How do I book an onboarding consultation or demo?",
      answer:
        "You can request available times right here in the chat. We will check available slots, verify your preferred time, ask for your confirmation, and immediately secure your appointment in the database.",
    },
    {
      question: "What happens when an issue is escalated to human support?",
      answer:
        "SupportPilot AI creates or updates your ticket with status 'Escalated' and 'Urgent' priority, captures the full conversation context and reason for escalation, and places it in the support dashboard triage queue for human agent review.",
    },
    {
      question: "Can I cancel or reschedule my booking?",
      answer:
        "Yes, you can request a reschedule by providing your booking ID or customer email. Our system will check alternate available slots and update your record.",
    },
    {
      question: "How is my data stored and secured?",
      answer:
        "All customer records, tickets, and bookings are securely stored in MongoDB Atlas with server-side validation and encryption in transit. Credentials and sensitive tokens are strictly kept on the server.",
    },
  ],
};

/**
 * Returns formatted knowledge context to be injected into system instructions.
 */
export function getKnowledgeBaseContext() {
  return JSON.stringify(KNOWLEDGE_BASE, null, 2);
}
