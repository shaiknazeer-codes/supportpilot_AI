/**
 * Strict tool definitions for OpenAI Function Calling in SupportPilot AI.
 * Covers: checkAvailability, createBooking, createTicket, recordLead, escalateToHuman.
 */
export const SUPPORT_TOOLS = [
  {
    type: "function",
    function: {
      name: "getMovieShowtimes",
      description:
        "Fetches currently screening movies, available theaters/locations, and show timings. When called with no arguments, returns all running movies. When given a movie name, returns the cinema locations/theaters where that movie is screening. When given a theater, returns showtimes and formats.",
      parameters: {
        type: "object",
        properties: {
          movie: {
            type: "string",
            description: "Title or partial name of the movie (e.g. 'Dune', 'Inception', 'Deadpool & Wolverine', 'Interstellar', 'Gladiator II').",
          },
          theaterOrLocation: {
            type: "string",
            description: "Cinema or location name (e.g. 'Downtown IMAX', 'Grand Plaza', 'CineStar', 'PVR Orion').",
          },
          date: {
            type: "string",
            description: "Date of the show in YYYY-MM-DD format (defaults to today/tomorrow).",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "bookMovieTicket",
      description:
        "Books confirmed movie tickets and saves the reservation directly into the MongoDB database. REQUIRES that the customer has explicitly confirmed the movie title, cinema theater, show timing, and ticket/seat count.",
      parameters: {
        type: "object",
        properties: {
          movie: {
            type: "string",
            description: "The title of the movie (e.g., 'Dune: Part Two', 'Inception').",
          },
          theater: {
            type: "string",
            description: "Cinema or theater name (e.g., 'Downtown IMAX Cinema').",
          },
          location: {
            type: "string",
            description: "Location or address of the theater (e.g., 'Downtown Center, Mall Level 3').",
          },
          showtime: {
            type: "string",
            description: "Selected show timing (e.g., '06:00 PM' or ISO datetime).",
          },
          showDate: {
            type: "string",
            description: "Date of the movie show in YYYY-MM-DD format.",
          },
          seatsCount: {
            type: "number",
            description: "Number of tickets/seats to book (default 1).",
            default: 1,
          },
          seatNumbers: {
            type: "string",
            description: "Optional seat identifiers (e.g. 'Seats E11, E12').",
          },
          customerName: {
            type: "string",
            description: "Full name of the customer.",
          },
          customerEmail: {
            type: "string",
            description: "Valid customer email address for ticket delivery.",
          },
          customerPhone: {
            type: "string",
            description: "Optional customer phone number.",
          },
          userConfirmed: {
            type: "boolean",
            description:
              "Must be true. Has the customer explicitly stated 'yes' or confirmed the movie, theater, showtime, and seat count? If not confirmed yet, do not set to true.",
          },
        },
        required: ["movie", "theater", "showtime", "customerName", "customerEmail", "userConfirmed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkAvailability",
      description:
        "Check real available consultation and appointment slots for a requested date from the live booking system. Returns only valid, unbooked business hour slots. Never invent availability.",
      parameters: {
        type: "object",
        properties: {
          date: {
            type: "string",
            description:
              "The requested date in YYYY-MM-DD format (e.g., '2026-11-05'). If the user says 'tomorrow' or 'next Tuesday', resolve to an ISO date.",
          },
          durationMinutes: {
            type: "number",
            description: "Desired appointment duration in minutes (default 30).",
            default: 30,
          },
          topic: {
            type: "string",
            description: "Subject or purpose of the appointment (e.g. 'Product Demo', 'Support Onboarding').",
          },
        },
        required: ["date"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createBooking",
      description:
        "Saves a confirmed customer appointment booking in the MongoDB database. REQUIRES that the customer has explicitly confirmed the date, time, and contact info. Validates slot availability to prevent double-booking.",
      parameters: {
        type: "object",
        properties: {
          customerName: {
            type: "string",
            description: "Full name of the customer.",
          },
          customerEmail: {
            type: "string",
            description: "Valid customer email address.",
          },
          customerPhone: {
            type: "string",
            description: "Optional customer phone number.",
          },
          scheduledAt: {
            type: "string",
            description:
              "ISO 8601 datetime string representing the confirmed appointment start time (e.g., '2026-11-05T14:00:00Z').",
          },
          durationMinutes: {
            type: "number",
            description: "Duration of the appointment in minutes (default 30).",
            default: 30,
          },
          topic: {
            type: "string",
            description: "Purpose or title of the booking.",
          },
          notes: {
            type: "string",
            description: "Any special requirements or background provided by the customer.",
          },
          userConfirmed: {
            type: "boolean",
            description:
              "Must be true. Has the customer explicitly stated 'yes' or confirmed the proposed time and booking details? If not confirmed yet, do not set to true.",
          },
        },
        required: ["customerName", "customerEmail", "scheduledAt", "topic", "userConfirmed"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "createTicket",
      description:
        "Logs a persistent customer support ticket in MongoDB. Returns the generated ticket ID (TK-XXXXXX) and status.",
      parameters: {
        type: "object",
        properties: {
          subject: {
            type: "string",
            description: "Concise summary of the customer's issue or request (min 3 chars).",
          },
          description: {
            type: "string",
            description: "Detailed description of the problem, error messages, or request.",
          },
          customerEmail: {
            type: "string",
            description: "Customer email address for correspondence.",
          },
          customerName: {
            type: "string",
            description: "Customer name if known.",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high", "urgent"],
            description: "Assessed priority of the issue (default 'medium').",
            default: "medium",
          },
          category: {
            type: "string",
            enum: ["general", "billing", "technical", "account", "feature_request"],
            description: "Category of the inquiry.",
            default: "general",
          },
        },
        required: ["subject", "description", "customerEmail"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "recordLead",
      description:
        "Captures and saves a prospective business lead or customer inquiry into MongoDB. Returns the generated lead ID (LD-XXXXXX).",
      parameters: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Contact name of the prospect.",
          },
          email: {
            type: "string",
            description: "Business or contact email.",
          },
          phone: {
            type: "string",
            description: "Optional phone number.",
          },
          company: {
            type: "string",
            description: "Company or organization name.",
          },
          interest: {
            type: "string",
            description: "Product interest, team size, or operational requirements.",
          },
          notes: {
            type: "string",
            description: "Key points from conversation regarding their business goals.",
          },
        },
        required: ["name", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "escalateToHuman",
      description:
        "Escalates an unresolved, complex, or high-priority request to a human support agent. Creates or flags a support ticket with status 'escalated' in the support dashboard triage queue.",
      parameters: {
        type: "object",
        properties: {
          customerEmail: {
            type: "string",
            description: "Customer email address.",
          },
          customerName: {
            type: "string",
            description: "Customer name.",
          },
          reason: {
            type: "string",
            description: "Explicit reason why human intervention is required.",
          },
          summary: {
            type: "string",
            description: "Contextual summary of what was attempted and current state.",
          },
          existingTicketId: {
            type: "string",
            description: "Existing ticket ID if this relates to an already logged ticket.",
          },
        },
        required: ["customerEmail", "reason", "summary"],
      },
    },
  },
];

export const SUPPORT_TOOLS_WHITELIST = [
  "getMovieShowtimes",
  "bookMovieTicket",
  "checkAvailability",
  "createBooking",
  "createTicket",
  "recordLead",
  "escalateToHuman",
];
