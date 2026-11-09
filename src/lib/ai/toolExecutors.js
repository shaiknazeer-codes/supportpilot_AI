import { getDatabase, isMongoDBConfigured } from "../db/mongodb.js";
import { COLLECTIONS, ensureIndexes } from "../db/collections.js";
import {
  generateUniqueId,
  validateBookingInput,
  validateTicketInput,
  validateLeadInput,
  isValidEmail,
  isValidDate,
} from "../db/validators.js";
import { MOVIE_CATALOG, HOSPITAL_CATALOG, HEALTHCARE_SPECIALTIES } from "./knowledgeBase.js";

/**
 * Standard business hour slot templates for weekday scheduling (UTC).
 */
const STANDARD_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
];

/**
 * Tool: checkAvailability
 * Real availability checker that queries MongoDB bookings to ensure no double-booking.
 */
export async function executeCheckAvailability({ date, durationMinutes = 30, topic = "Consultation" }) {
  if (!date || typeof date !== "string") {
    return {
      success: false,
      error: "INVALID_DATE",
      message: "Please specify a requested date in YYYY-MM-DD format.",
    };
  }

  const trimmedDate = date.trim();
  const dateObj = new Date(trimmedDate + "T00:00:00.000Z");

  if (isNaN(dateObj.getTime())) {
    return {
      success: false,
      error: "MALFORMED_DATE",
      message: `The date '${trimmedDate}' is not a valid date string. Please provide YYYY-MM-DD.`,
    };
  }

  // Prevent past dates
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  if (dateObj < today) {
    return {
      success: false,
      error: "DATE_IN_PAST",
      message: `The requested date ${trimmedDate} is in the past. Please select today or a future date.`,
    };
  }

  // Check weekday (0 = Sun, 6 = Sat)
  const dayOfWeek = dateObj.getUTCDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  if (isWeekend) {
    return {
      success: true,
      date: trimmedDate,
      isWeekend: true,
      availableSlots: [],
      message: `${trimmedDate} falls on a weekend. SupportPilot operations consultations are held Monday through Friday (09:00 to 17:00 UTC). Please request a weekday.`,
    };
  }

  // Generate candidate slots for the day (Monday through Friday, 09:00 - 16:00 UTC)
  const candidateSlots = STANDARD_SLOTS.map((time) => `${trimmedDate}T${time}:00.000Z`);

  if (!isMongoDBConfigured()) {
    console.warn(`[checkAvailability Diagnostic]: Database is not configured. Aborting slot query for date ${trimmedDate}.`);
    return {
      success: false,
      error: "DATABASE_NOT_CONFIGURED",
      date: trimmedDate,
      availableSlots: [],
      dbActive: false,
      message: "Database connection is unconfigured. Cannot verify live consultation slot availability.",
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const startOfDay = new Date(trimmedDate + "T00:00:00.000Z");
    const endOfDay = new Date(trimmedDate + "T23:59:59.999Z");

    console.log(
      `[checkAvailability Diagnostic]: Querying '${COLLECTIONS.BOOKINGS}' for ${trimmedDate} (UTC window: ${startOfDay.toISOString()} - ${endOfDay.toISOString()})`
    );

    const existingBookings = await db
      .collection(COLLECTIONS.BOOKINGS)
      .find({
        $or: [
          { scheduledAt: { $gte: startOfDay, $lte: endOfDay } },
          { scheduledAt: { $gte: startOfDay.toISOString(), $lte: endOfDay.toISOString() } },
        ],
        status: { $ne: "cancelled" },
      })
      .toArray();

    const bookedTimes = new Set(
      existingBookings.map((b) => new Date(b.scheduledAt).toISOString())
    );

    const openSlots = candidateSlots.filter((slot) => !bookedTimes.has(slot));

    console.log(
      `[checkAvailability Diagnostic]: Query succeeded. Confirmed ${existingBookings.length} existing booking(s), ${openSlots.length} available slot(s) on ${trimmedDate}.`
    );

    return {
      success: true,
      dbActive: true,
      date: trimmedDate,
      availableSlots: openSlots,
      bookedSlotsCount: bookedTimes.size,
      durationMinutes: Number(durationMinutes) || 30,
      timezone: "UTC",
      message:
        openSlots.length > 0
          ? `Found ${openSlots.length} available slots for ${trimmedDate} verified from database.`
          : `All standard consultation slots for ${trimmedDate} are currently booked in the database. Please request another date.`,
    };
  } catch (error) {
    console.error(`[checkAvailability Diagnostic]: Database query failed: ${error.message}`);
    return {
      success: false,
      error: "DATABASE_QUERY_FAILED",
      date: trimmedDate,
      availableSlots: [],
      dbActive: false,
      message: `Unable to verify live calendar availability. Database query failed: ${error.message}`,
    };
  }
}

/**
 * Tool: createBooking
 * Validates, enforces customer confirmation, checks for double-booking, and persists.
 */
export async function executeCreateBooking(args) {
  // 1. Enforce Confirmation Requirement
  if (!args || args.userConfirmed !== true) {
    return {
      success: false,
      requiresConfirmation: true,
      pendingDetails: {
        customerName: args?.customerName,
        customerEmail: args?.customerEmail,
        scheduledAt: args?.scheduledAt,
        topic: args?.topic || "Consultation",
      },
      message:
        "Booking is PENDING customer confirmation. Do NOT claim the booking is created yet. You must present the proposed appointment time and contact details to the customer and ask: 'Would you like me to confirm and reserve this appointment for you?'",
    };
  }

  // 2. Validate input schema
  const validation = validateBookingInput(args);
  if (!validation.valid) {
    return {
      success: false,
      error: "VALIDATION_FAILED",
      message: validation.error,
    };
  }

  if (!isMongoDBConfigured()) {
    return {
      success: false,
      error: "DATABASE_UNCONFIGURED",
      message: "MongoDB Atlas is not configured. Cannot persist booking without active database connection.",
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const bookingData = validation.data;
    const scheduled = new Date(bookingData.scheduledAt);

    // 3. Double-Booking & Conflict Prevention (within 25 minute window)
    const windowStart = new Date(scheduled.getTime() - 25 * 60 * 1000);
    const windowEnd = new Date(scheduled.getTime() + 25 * 60 * 1000);

    const existingConflict = await db.collection(COLLECTIONS.BOOKINGS).findOne({
      scheduledAt: { $gte: windowStart, $lte: windowEnd },
      status: { $ne: "cancelled" },
    });

    if (existingConflict) {
      // Check if it's the exact same customer retrying within 2 minutes (idempotency)
      if (
        existingConflict.customerEmail === bookingData.customerEmail &&
        Date.now() - new Date(existingConflict.createdAt).getTime() < 120000
      ) {
        return {
          success: true,
          bookingId: existingConflict.bookingId,
          customerName: existingConflict.customerName,
          customerEmail: existingConflict.customerEmail,
          scheduledAt: existingConflict.scheduledAt,
          status: existingConflict.status,
          message: `Booking already confirmed with Booking ID: ${existingConflict.bookingId}.`,
        };
      }

      return {
        success: false,
        error: "SLOT_CONFLICT",
        message: `The slot at ${scheduled.toISOString()} has already been booked. Please choose an alternate available slot.`,
      };
    }

    // 4. Construct persistent document
    const now = new Date();
    const newBooking = {
      ...bookingData,
      bookingId: generateUniqueId("BK"),
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection(COLLECTIONS.BOOKINGS).insertOne(newBooking);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to acknowledge booking persistence.",
      };
    }

    return {
      success: true,
      bookingId: newBooking.bookingId,
      customerName: newBooking.customerName,
      customerEmail: newBooking.customerEmail,
      scheduledAt: newBooking.scheduledAt,
      durationMinutes: newBooking.durationMinutes,
      topic: newBooking.topic,
      status: newBooking.status,
      message: `Appointment officially booked and confirmed in MongoDB. Booking ID: ${newBooking.bookingId}.`,
    };
  } catch (error) {
    console.error("[createBooking Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to persist booking in database.",
    };
  }
}

/**
 * Tool: createTicket
 * Logs a support ticket in MongoDB and returns the generated ticket ID.
 */
export async function executeCreateTicket(args) {
  const validation = validateTicketInput(args);
  if (!validation.valid) {
    return {
      success: false,
      error: "VALIDATION_FAILED",
      message: validation.error,
    };
  }

  if (!isMongoDBConfigured()) {
    return {
      success: false,
      error: "DATABASE_UNCONFIGURED",
      message: "MongoDB Atlas is not configured. Cannot log ticket without active database connection.",
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const ticketData = validation.data;

    // Idempotency check (within 2 minutes)
    const recentDuplicate = await db.collection(COLLECTIONS.TICKETS).findOne({
      customerEmail: ticketData.customerEmail,
      subject: ticketData.subject,
      createdAt: { $gte: new Date(Date.now() - 120000) },
    });

    if (recentDuplicate) {
      return {
        success: true,
        ticketId: recentDuplicate.ticketId,
        subject: recentDuplicate.subject,
        priority: recentDuplicate.priority,
        category: recentDuplicate.category,
        status: recentDuplicate.status,
        message: `Support ticket already recorded with Ticket ID: ${recentDuplicate.ticketId}.`,
      };
    }

    const now = new Date();
    const newTicket = {
      ...ticketData,
      ticketId: generateUniqueId("TK"),
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection(COLLECTIONS.TICKETS).insertOne(newTicket);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to acknowledge ticket persistence.",
      };
    }

    return {
      success: true,
      ticketId: newTicket.ticketId,
      subject: newTicket.subject,
      priority: newTicket.priority,
      category: newTicket.category,
      status: newTicket.status,
      message: `Support ticket logged in MongoDB. Ticket ID: ${newTicket.ticketId}.`,
    };
  } catch (error) {
    console.error("[createTicket Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to persist support ticket in database.",
    };
  }
}

/**
 * Tool: recordLead
 * Saves a prospective customer lead into MongoDB.
 */
export async function executeRecordLead(args) {
  const validation = validateLeadInput(args);
  if (!validation.valid) {
    return {
      success: false,
      error: "VALIDATION_FAILED",
      message: validation.error,
    };
  }

  if (!isMongoDBConfigured()) {
    return {
      success: false,
      error: "DATABASE_UNCONFIGURED",
      message: "MongoDB Atlas is not configured. Cannot save lead without active database connection.",
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const leadData = validation.data;
    const now = new Date();
    const newLead = {
      ...leadData,
      leadId: generateUniqueId("LD"),
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection(COLLECTIONS.LEADS).insertOne(newLead);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to acknowledge lead persistence.",
      };
    }

    return {
      success: true,
      leadId: newLead.leadId,
      name: newLead.name,
      email: newLead.email,
      company: newLead.company,
      status: newLead.status,
      message: `Lead successfully recorded in database. Lead ID: ${newLead.leadId}.`,
    };
  } catch (error) {
    console.error("[recordLead Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to record lead in database.",
    };
  }
}

/**
 * Tool: escalateToHuman
 * Creates or updates a ticket with status 'escalated' and priority 'urgent' in MongoDB.
 */
export async function executeEscalateToHuman(args) {
  const { customerEmail, customerName = "Valued Customer", reason, summary, existingTicketId } = args || {};

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return {
      success: false,
      error: "INVALID_EMAIL",
      message: "A valid customerEmail is required to escalate an issue.",
    };
  }

  if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
    return {
      success: false,
      error: "REASON_REQUIRED",
      message: "A detailed escalation reason must be recorded.",
    };
  }

  if (!isMongoDBConfigured()) {
    return {
      success: false,
      error: "DATABASE_UNCONFIGURED",
      message: "MongoDB Atlas is not configured. Cannot persist escalation without database connection.",
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const now = new Date();

    // If customer referenced an existing ticket, update it
    if (existingTicketId && typeof existingTicketId === "string") {
      const existing = await db.collection(COLLECTIONS.TICKETS).findOne({
        ticketId: existingTicketId.trim(),
      });

      if (existing) {
        await db.collection(COLLECTIONS.TICKETS).updateOne(
          { ticketId: existing.ticketId },
          {
            $set: {
              status: "escalated",
              priority: "urgent",
              updatedAt: now,
              resolutionNotes: `ESCALATED: ${reason}. Summary: ${summary || "None provided"}`,
            },
          }
        );

        return {
          success: true,
          ticketId: existing.ticketId,
          status: "escalated",
          priority: "urgent",
          reason: reason.trim(),
          queue: "Support Dashboard Triage Queue",
          message: `Ticket ${existing.ticketId} status has been updated to 'Escalated' with 'Urgent' priority and placed in the support dashboard triage queue for human agent review.`,
        };
      }
    }

    // Otherwise, create a new escalated ticket
    const newTicket = {
      ticketId: generateUniqueId("TK"),
      subject: `ESCALATED: ${reason.trim().slice(0, 60)}`,
      description: `Customer: ${customerName} (${customerEmail})\nReason for Escalation: ${reason}\n\nContext Summary:\n${summary || "Direct customer escalation request."}`,
      customerEmail: customerEmail.trim().toLowerCase(),
      customerName: customerName.trim(),
      customerPhone: typeof args?.customerPhone === "string" ? args.customerPhone.trim() : null,
      priority: "urgent",
      category: "technical",
      status: "escalated",
      source: args?.channel === "whatsapp" ? "whatsapp" : "ai_agent",
      channel: args?.channel === "whatsapp" ? "whatsapp" : "website",
      assignedTo: null,
      resolutionNotes: `Escalated directly by SupportPilot AI (${args?.channel === "whatsapp" ? "WhatsApp Channel" : "Website Chat"}). Reason: ${reason}`,
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await db.collection(COLLECTIONS.TICKETS).insertOne(newTicket);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to persist escalation record.",
      };
    }

    return {
      success: true,
      ticketId: newTicket.ticketId,
      status: "escalated",
      priority: "urgent",
      channel: newTicket.channel,
      reason: reason.trim(),
      queue: "Support Dashboard Triage Queue",
      message: `Your request has been escalated. Support ticket ${newTicket.ticketId} has been created with status 'Escalated' and placed in the triage queue for human agent review.`,
    };
  } catch (error) {
    console.error("[escalateToHuman Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to escalate ticket in database.",
    };
  }
}

/**
 * Tool: getMovieShowtimes
 * Returns running movies, theaters/locations where they are playing, and show timings.
 */
export async function executeGetMovieShowtimes(args = {}) {
  const { movie, theaterOrLocation } = args;

  // If no movie is provided, return all currently showing movies
  if (!movie || !movie.trim()) {
    const moviesSummary = MOVIE_CATALOG.map((m) => ({
      title: m.title,
      genre: m.genre,
      duration: m.duration,
      rating: m.rating,
      theatersAvailable: m.theaters.map((t) => t.name),
    }));
    return {
      success: true,
      stage: "select_movie",
      count: moviesSummary.length,
      movies: moviesSummary,
      message:
        "Here are the movies currently screening. Please select a movie to view available cinema locations and showtimes.",
    };
  }

  const queryMovie = movie.trim().toLowerCase();
  const matchedMovie = MOVIE_CATALOG.find((m) =>
    m.title.toLowerCase().includes(queryMovie) || queryMovie.includes(m.id)
  );

  if (!matchedMovie) {
    return {
      success: false,
      error: "MOVIE_NOT_FOUND",
      message: `We could not find '${movie}' in currently screening movies. Currently playing: ${MOVIE_CATALOG.map((m) => m.title).join(", ")}.`,
      availableMovies: MOVIE_CATALOG.map((m) => m.title),
    };
  }

  // If theaterOrLocation is specified, filter to that theater
  let theaters = matchedMovie.theaters;
  if (theaterOrLocation && theaterOrLocation.trim()) {
    const queryLoc = theaterOrLocation.trim().toLowerCase();
    const filtered = theaters.filter(
      (t) =>
        t.name.toLowerCase().includes(queryLoc) ||
        t.location.toLowerCase().includes(queryLoc)
    );
    if (filtered.length > 0) {
      theaters = filtered;
    }
  }

  return {
    success: true,
    stage: theaterOrLocation ? "select_timing" : "select_location",
    movie: matchedMovie.title,
    genre: matchedMovie.genre,
    duration: matchedMovie.duration,
    rating: matchedMovie.rating,
    theaters: theaters.map((t) => ({
      name: t.name,
      location: t.location,
      formats: t.formats,
      price: t.price,
      timings: t.timings,
      availableSeats: t.availableSeats || 48,
      totalSeats: t.totalSeats || 90,
    })),
    message: `Found ${theaters.length} cinema location(s) screening '${matchedMovie.title}'.`,
  };
}

/**
 * Tool: bookMovieTicket
 * Validates movie booking, requires explicit customer confirmation, and persists to MongoDB.
 */
export async function executeBookMovieTicket(args) {
  if (!args || typeof args !== "object") {
    return {
      success: false,
      error: "INVALID_ARGUMENTS",
      message: "Booking arguments missing.",
    };
  }

  const {
    movie,
    theater,
    location,
    showtime,
    showDate,
    seatsCount = 1,
    seatNumbers,
    customerName,
    customerEmail,
    customerPhone,
    userConfirmed,
    channel = "website",
  } = args;

  if (!movie || !theater || !showtime) {
    return {
      success: false,
      error: "MISSING_DETAILS",
      message: "Movie title, cinema theater, and showtime are required to book tickets.",
    };
  }

  // Enforce customer confirmation
  if (userConfirmed !== true) {
    return {
      success: false,
      requiresConfirmation: true,
      pendingDetails: {
        movie,
        theater,
        location: location || "Main Complex",
        showtime,
        showDate: showDate || new Date().toISOString().slice(0, 10),
        seatsCount: Number(seatsCount) || 1,
        seatNumbers: seatNumbers || "Standard Reserved Row E",
        customerName: customerName || "Customer",
        customerEmail: customerEmail || "",
      },
      message: `Movie ticket reservation is pending your confirmation. Movie: ${movie}, Cinema: ${theater}, Showtime: ${showtime}, Seats: ${seatsCount || 1}. Please confirm to reserve your seats!`,
    };
  }

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Please provide a valid customer name for the ticket reservation.",
    };
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return {
      success: false,
      error: "INVALID_EMAIL",
      message: "Please provide a valid customer email address to receive your tickets.",
    };
  }

  const bookingId = generateUniqueId("BK-MOV");
  const count = Number(seatsCount) || 1;
  const parsedDate = showDate && isValidDate(showDate) ? new Date(showDate) : new Date();

  const movieTopic = `Movie: ${movie.trim()} @ ${theater.trim()} (${count} Ticket${count > 1 ? "s" : ""}, ${showtime.trim()})`;
  const assignedSeats =
    seatNumbers ||
    `Row F (Seats ${Math.floor(Math.random() * 8) + 1} - ${Math.floor(Math.random() * 8) + count})`;

  const ticketDocument = {
    bookingId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone ? customerPhone.trim() : null,
    movie: movie.trim(),
    theater: theater.trim(),
    location: location ? location.trim() : "Main Theater Complex",
    showtime: showtime.trim(),
    showDate: parsedDate.toISOString().slice(0, 10),
    scheduledAt: parsedDate,
    durationMinutes: 150,
    seatsCount: count,
    seatNumbers: assignedSeats,
    topic: movieTopic,
    bookingType: "movie_ticket",
    status: "confirmed",
    channel: channel === "whatsapp" ? "whatsapp" : "website",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!isMongoDBConfigured()) {
    return {
      success: true,
      bookingId,
      movie: ticketDocument.movie,
      theater: ticketDocument.theater,
      location: ticketDocument.location,
      showtime: ticketDocument.showtime,
      seatsCount: count,
      seatNumbers: assignedSeats,
      customerName: ticketDocument.customerName,
      customerEmail: ticketDocument.customerEmail,
      topic: movieTopic,
      status: "confirmed",
      dbActive: false,
      message: `🎟️ Movie tickets successfully booked! Booking ID: ${bookingId}. Your digital pass for '${movie}' at ${theater} has been confirmed.`,
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const insertResult = await db.collection(COLLECTIONS.BOOKINGS).insertOne(ticketDocument);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to persist movie ticket booking.",
      };
    }

    return {
      success: true,
      bookingId,
      movie: ticketDocument.movie,
      theater: ticketDocument.theater,
      location: ticketDocument.location,
      showtime: ticketDocument.showtime,
      seatsCount: count,
      seatNumbers: assignedSeats,
      customerName: ticketDocument.customerName,
      customerEmail: ticketDocument.customerEmail,
      topic: movieTopic,
      status: "confirmed",
      dbActive: true,
      message: `🎟️ Movie tickets successfully booked and saved in database! Booking ID: ${bookingId}. Your digital pass for '${movie}' at ${theater} is confirmed.`,
    };
  } catch (error) {
    console.error("[bookMovieTicket Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to save movie ticket in database.",
    };
  }
}

/**
 * Tool: getHospitalsAndSlots
 * Returns partner hospitals, locations, departments, operating days, and available consultation time slots.
 */
export async function executeGetHospitalsAndSlots(args = {}) {
  const { hospital, department, dayOrDate } = args;

  // Match medical field or specialty if specified
  let matchedSpecialty = null;
  if (department && typeof department === "string" && department.trim()) {
    const deptLower = department.trim().toLowerCase();
    matchedSpecialty = HEALTHCARE_SPECIALTIES.find(
      (s) =>
        s.name.toLowerCase().includes(deptLower) ||
        s.shortName.toLowerCase().includes(deptLower) ||
        s.keywords.some((k) => deptLower.includes(k) || k.includes(deptLower))
    );
  }

  // If no hospital is specified:
  if (!hospital || !hospital.trim()) {
    let filteredHospitals = HOSPITAL_CATALOG;
    if (matchedSpecialty) {
      filteredHospitals = HOSPITAL_CATALOG.filter((h) =>
        h.departments.some(
          (d) =>
            d.toLowerCase().includes(matchedSpecialty.shortName.toLowerCase()) ||
            d.toLowerCase().includes(matchedSpecialty.id)
        )
      );
      if (filteredHospitals.length === 0) filteredHospitals = HOSPITAL_CATALOG;
    }

    const list = filteredHospitals.map((h) => ({
      name: h.name,
      location: h.location,
      city: h.city || "Indore",
      departments: h.departments,
      doctors: h.doctors,
      availableDays: h.availableDays,
      timings: h.timings,
      fee: h.consultationFee,
    }));

    return {
      success: true,
      stage: matchedSpecialty ? "select_hospital_for_specialty" : "select_specialty_and_hospital",
      count: list.length,
      selectedSpecialty: matchedSpecialty ? matchedSpecialty.name : null,
      specialties: HEALTHCARE_SPECIALTIES.map((s) => ({
        id: s.id,
        name: s.name,
        shortName: s.shortName,
        description: s.description,
      })),
      hospitals: list,
      message: matchedSpecialty
        ? `Found ${list.length} premier Indore hospital(s) with specialists in ${matchedSpecialty.name}. Please select your preferred hospital.`
        : "Here are premier hospitals in Indore and medical specialties. Please select a specialty and hospital.",
    };
  }

  // If hospital is specified:
  const queryHosp = hospital.trim().toLowerCase();
  const matched = HOSPITAL_CATALOG.find((h) => {
    const hLower = h.name.toLowerCase();
    return (
      hLower.includes(queryHosp) ||
      queryHosp.includes(h.id) ||
      (queryHosp.includes("bombay") && h.id === "bombay-hospital") ||
      (queryHosp.includes("medanta") && h.id === "medanta-indore") ||
      (queryHosp.includes("chl") && h.id === "care-chl") ||
      (queryHosp.includes("apollo") && h.id === "apollo-indore") ||
      (queryHosp.includes("choithram") && h.id === "choithram-hospital") ||
      (queryHosp.includes("shalby") && h.id === "shalby-hospital") ||
      (queryHosp.includes("jupiter") && h.id === "vishesh-jupiter") ||
      (queryHosp.includes("vishesh") && h.id === "vishesh-jupiter")
    );
  });

  if (!matched) {
    return {
      success: false,
      error: "HOSPITAL_NOT_FOUND",
      message: `We could not find '${hospital}' in Indore. Available hospitals: ${HOSPITAL_CATALOG.map((h) => h.name).join(", ")}.`,
      availableHospitals: HOSPITAL_CATALOG.map((h) => h.name),
    };
  }

  // Determine department key and assigned doctor
  let deptKey = matched.departments[0];
  if (matchedSpecialty) {
    const found = matched.departments.find(
      (d) =>
        d.toLowerCase().includes(matchedSpecialty.shortName.toLowerCase()) ||
        d.toLowerCase().includes(matchedSpecialty.id)
    );
    if (found) deptKey = found;
  }
  const assignedDoctor = matched.doctors[deptKey] || Object.values(matched.doctors)[0] || "Senior Consultant";

  return {
    success: true,
    stage: dayOrDate ? "select_timing" : "select_day",
    hospital: matched.name,
    location: matched.location,
    city: matched.city || "Indore",
    departments: matched.departments,
    selectedDepartment: deptKey,
    assignedDoctor,
    availableDays: matched.availableDays,
    timings: matched.timings,
    fee: matched.consultationFee,
    requestedDay: dayOrDate || null,
    specialties: HEALTHCARE_SPECIALTIES.map((s) => ({
      id: s.id,
      name: s.name,
      shortName: s.shortName,
      description: s.description,
    })),
    message: dayOrDate
      ? `Available consultation timings for ${assignedDoctor} at ${matched.name} on ${dayOrDate}: ${matched.timings.join(", ")} (Fee: ${matched.consultationFee}).`
      : `${matched.name} specialist consultations are available on ${matched.availableDays.join(", ")}. Please select your preferred day or date.`,
  };
}

/**
 * Tool: bookHospitalConsultation
 * Validates hospital consultation, requires explicit confirmation, and persists to MongoDB.
 */
export async function executeBookHospitalConsultation(args) {
  if (!args || typeof args !== "object") {
    return {
      success: false,
      error: "INVALID_ARGUMENTS",
      message: "Consultation arguments missing.",
    };
  }

  const {
    hospital,
    location,
    department = "General Medicine",
    doctor,
    consultationFee,
    day,
    time,
    customerName,
    customerEmail,
    customerPhone,
    notes,
    userConfirmed,
    channel = "website",
  } = args;

  if (!hospital || !day || !time) {
    return {
      success: false,
      error: "MISSING_DETAILS",
      message: "Hospital name, preferred day, and timing slot are required to book consultation.",
    };
  }

  if (userConfirmed !== true) {
    return {
      success: false,
      requiresConfirmation: true,
      pendingDetails: {
        hospital,
        location: location || "Main Healthcare Campus, Indore",
        department,
        doctor: doctor || "Specialist Consultant",
        consultationFee: consultationFee || "₹700",
        day,
        time,
        customerName: customerName || "Patient",
        customerEmail: customerEmail || "",
      },
      message: `Consultation at ${hospital} (${department}) with ${doctor || "Specialist"} on ${day} at ${time} is pending your confirmation. Reply 'Confirm' to finalize your appointment!`,
    };
  }

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    return {
      success: false,
      error: "INVALID_NAME",
      message: "Please provide a valid patient name for the consultation record.",
    };
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return {
      success: false,
      error: "INVALID_EMAIL",
      message: "Please provide a valid patient email address for appointment confirmation.",
    };
  }

  const bookingId = generateUniqueId("BK-MED");
  const topic = `Consultation: ${hospital.trim()} (${department}) - ${day} at ${time}`;

  // Approximate scheduled datetime for the booking
  const now = new Date();
  const scheduledDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const consultationDoc = {
    bookingId,
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim().toLowerCase(),
    customerPhone: customerPhone ? customerPhone.trim() : null,
    hospital: hospital.trim(),
    location: location ? location.trim() : "Main Medical Center, Indore",
    department: department ? department.trim() : "General Medicine",
    doctor: doctor ? doctor.trim() : "Specialist Consultant",
    consultationFee: consultationFee ? consultationFee.trim() : "₹700",
    day: day.trim(),
    time: time.trim(),
    topic,
    notes: notes || "Specialist hospital consultation in Indore",
    scheduledAt: scheduledDate,
    durationMinutes: 45,
    bookingType: "hospital_consultation",
    status: "confirmed",
    channel: channel === "whatsapp" ? "whatsapp" : "website",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!isMongoDBConfigured()) {
    return {
      success: true,
      bookingId,
      hospital: consultationDoc.hospital,
      location: consultationDoc.location,
      department: consultationDoc.department,
      doctor: consultationDoc.doctor,
      consultationFee: consultationDoc.consultationFee,
      day: consultationDoc.day,
      time: consultationDoc.time,
      customerName: consultationDoc.customerName,
      customerEmail: consultationDoc.customerEmail,
      topic,
      status: "confirmed",
      dbActive: false,
      message: `🏥 Consultation successfully booked! Booking ID: ${bookingId}. Your appointment at ${hospital} (${department}) on ${day} at ${time} is confirmed.`,
    };
  }

  try {
    const db = await getDatabase();
    await ensureIndexes(db);

    const insertResult = await db.collection(COLLECTIONS.BOOKINGS).insertOne(consultationDoc);

    if (!insertResult.acknowledged) {
      return {
        success: false,
        error: "WRITE_FAILED",
        message: "Database failed to persist consultation booking.",
      };
    }

    return {
      success: true,
      bookingId,
      hospital: consultationDoc.hospital,
      location: consultationDoc.location,
      department: consultationDoc.department,
      doctor: consultationDoc.doctor,
      consultationFee: consultationDoc.consultationFee,
      day: consultationDoc.day,
      time: consultationDoc.time,
      customerName: consultationDoc.customerName,
      customerEmail: consultationDoc.customerEmail,
      topic,
      status: "confirmed",
      dbActive: true,
      message: `🏥 Consultation successfully booked and registered in database! Booking ID: ${bookingId}. Your appointment at ${hospital} (${department}) on ${day} at ${time} is confirmed.`,
    };
  } catch (error) {
    console.error("[bookHospitalConsultation Error]:", error);
    return {
      success: false,
      error: "DATABASE_ERROR",
      message: error.message || "Failed to save consultation in database.",
    };
  }
}

/**
 * Dispatcher for all supported tool executions.
 * Accepts optional context object ({ channel, customerPhone, customerEmail, ... }).
 */
export async function executeToolCall(toolName, rawArgs, context = {}) {
  let args = {};
  try {
    args = typeof rawArgs === "string" ? JSON.parse(rawArgs) : rawArgs || {};
  } catch {
    return {
      success: false,
      error: "MALFORMED_TOOL_ARGUMENTS",
      message: "Tool arguments could not be parsed as valid JSON.",
    };
  }

  // Merge contextual metadata like channel and customerPhone if not already present in tool arguments
  if (context && typeof context === "object") {
    if (context.channel && !args.channel) args.channel = context.channel;
    if (context.customerPhone && !args.customerPhone) args.customerPhone = context.customerPhone;
    if (context.customerName && !args.customerName) args.customerName = context.customerName;
    if (context.customerEmail && !args.customerEmail) args.customerEmail = context.customerEmail;
  }

  switch (toolName) {
    case "getHospitalsAndSlots":
      return await executeGetHospitalsAndSlots(args);
    case "bookHospitalConsultation":
      return await executeBookHospitalConsultation(args);
    case "getMovieShowtimes":
      return await executeGetMovieShowtimes(args);
    case "bookMovieTicket":
      return await executeBookMovieTicket(args);
    case "checkAvailability":
      return await executeCheckAvailability(args);
    case "createBooking":
      return await executeCreateBooking(args);
    case "createTicket":
      return await executeCreateTicket(args);
    case "recordLead":
      return await executeRecordLead(args);
    case "escalateToHuman":
      return await executeEscalateToHuman(args);
    default:
      return {
        success: false,
        error: "UNKNOWN_TOOL",
        message: `Tool '${toolName}' is not recognized or permitted.`,
      };
  }
}
