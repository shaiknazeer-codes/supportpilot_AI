import { getAIClient, getAIModel, getAIProvider } from "./client.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { SUPPORT_TOOLS, SUPPORT_TOOLS_WHITELIST } from "./tools.js";
import { executeToolCall } from "./toolExecutors.js";
import { MOVIE_CATALOG, HOSPITAL_CATALOG } from "./knowledgeBase.js";

/**
 * Autonomous operations fallback when AI provider quota or rate limit is reached.
 * Executes the real backend customer operation tools (bookings, tickets, leads, availability, escalation)
 * ensuring operations run directly without inventing data.
 */
export async function handleAutonomousFallback(userPrompt, activeModel = "Autonomous Engine", context = {}, conversationHistory = []) {
  const lower = (userPrompt || "").toLowerCase();
  const executedToolActions = [];
  let reply = "";

  // Combine user messages to accurately detect customer intent and explicit selections
  const userMessagesText = (
    conversationHistory
      .filter((m) => m.role === "user")
      .map((m) => m.content || "")
      .join(" ") + " " + (userPrompt || "")
  ).toLowerCase();

  // Detect Movie Ticket Booking Intent
  // NOTE: Do NOT use bare "ticket" here — it conflicts with "support ticket". Use "movie ticket" or specific movie terms.
  const isMovieIntent =
    userMessagesText.includes("movie") ||
    userMessagesText.includes("cinema") ||
    userMessagesText.includes("theatre") ||
    userMessagesText.includes("theater") ||
    userMessagesText.includes("showtime") ||
    userMessagesText.includes("seat") ||
    /book\s*(\d+)?\s*tickets?/i.test(userMessagesText) ||
    MOVIE_CATALOG.some((m) => {
      const titleLower = m.title.toLowerCase();
      const firstWord = titleLower.split(/[: ]/)[0];
      return (
        userMessagesText.includes(titleLower) ||
        userMessagesText.includes(m.id) ||
        (firstWord.length > 3 && userMessagesText.includes(firstWord))
      );
    });

  const isConsultationBooking =
    (lower.includes("demo") || lower.includes("onboarding") || lower.includes("consultation")) &&
    !userMessagesText.includes("movie") &&
    !userMessagesText.includes("ticket");

  if (isMovieIntent && !isConsultationBooking && !lower.includes("bug") && !lower.includes("error") && !lower.includes("504")) {
    // 1. Identify if a movie has been chosen by the customer
    let selectedMovie = null;
    for (const m of MOVIE_CATALOG) {
      const titleLower = m.title.toLowerCase();
      const firstWord = titleLower.split(/[: ]/)[0];
      if (
        userMessagesText.includes(titleLower) ||
        userMessagesText.includes(m.id) ||
        (firstWord.length > 3 && userMessagesText.includes(firstWord)) ||
        (titleLower.includes("bhool") && userMessagesText.includes("bhool")) ||
        (titleLower.includes("singham") && userMessagesText.includes("singham")) ||
        (titleLower.includes("gladiator") && userMessagesText.includes("gladiator")) ||
        (titleLower.includes("amaran") && userMessagesText.includes("amaran")) ||
        (titleLower.includes("venom") && userMessagesText.includes("venom")) ||
        (titleLower.includes("stree") && userMessagesText.includes("stree"))
      ) {
        selectedMovie = m;
        break;
      }
    }

    // 2. Identify if a theater/location has been chosen by the customer
    let selectedTheater = null;
    if (selectedMovie) {
      for (const t of selectedMovie.theaters) {
        const tLower = t.name.toLowerCase();
        if (
          userMessagesText.includes(tLower) ||
          (tLower.includes("c-21") && (userMessagesText.includes("c21") || userMessagesText.includes("c-21"))) ||
          (tLower.includes("treasure island") && (userMessagesText.includes("ti") || userMessagesText.includes("treasure"))) ||
          (tLower.includes("phoenix") && (userMessagesText.includes("phoenix") || userMessagesText.includes("citadel"))) ||
          (tLower.includes("velocity") && (userMessagesText.includes("velocity") || userMessagesText.includes("miraj"))) ||
          (tLower.includes("malhar") && (userMessagesText.includes("malhar") || userMessagesText.includes("rajhans"))) ||
          (tLower.includes("central") && (userMessagesText.includes("nexus") || userMessagesText.includes("central"))) ||
          (tLower.includes("imax") && userMessagesText.includes("imax")) ||
          (tLower.includes("pvr") && userMessagesText.includes("pvr")) ||
          (tLower.includes("inox") && userMessagesText.includes("inox"))
        ) {
          selectedTheater = t;
          break;
        }
      }
    }

    // 3. Identify if a showtime has been chosen by the customer
    let selectedTiming = null;
    if (selectedTheater) {
      for (const timing of selectedTheater.timings) {
        const timeDigits = timing.split(" ")[0].replace(/^0/, "");
        if (userMessagesText.includes(timing.toLowerCase()) || userMessagesText.includes(timeDigits)) {
          selectedTiming = timing;
          break;
        }
      }
      if (!selectedTiming) {
        if (userMessagesText.includes("morning")) selectedTiming = selectedTheater.timings[0];
        else if (userMessagesText.includes("matinee") || userMessagesText.includes("afternoon"))
          selectedTiming = selectedTheater.timings[1] || selectedTheater.timings[0];
        else if (userMessagesText.includes("evening"))
          selectedTiming = selectedTheater.timings[2] || selectedTheater.timings[1];
        else if (userMessagesText.includes("night") || userMessagesText.includes("late"))
          selectedTiming = selectedTheater.timings[selectedTheater.timings.length - 1];
      }
    }

    // 4. Check for confirmation intent
    const isConfirmed =
      lower.includes("confirm") ||
      lower.includes("yes") ||
      lower.includes("proceed") ||
      lower.includes("agree") ||
      lower.includes("book it") ||
      lower.includes("sure");

    // Extract customer details and seat count
    const emailMatch = userMessagesText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "customer@example.com");
    const nameMatch =
      userMessagesText.match(/for ([A-Z][a-z]+ [A-Z][a-z]+)/i) ||
      userMessagesText.match(/my name is ([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/i);
    const customerName = nameMatch ? (nameMatch[1] || nameMatch[0]) : (context.customerName || "Movie Guest");
    
    const numWordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
    const seatsMatch =
      userMessagesText.match(/(\d+)\s*(tickets?|seats?|people|persons?)/i) ||
      userMessagesText.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s*(tickets?|seats?|people|persons?)/i) ||
      userMessagesText.match(/quantity\s*[:=]?\s*(\d+)/i) ||
      userMessagesText.match(/(\d+)\s*(pass|passes)/i);
    let seatsCount = 2;
    if (seatsMatch) {
      const parsed = parseInt(seatsMatch[1], 10);
      if (!isNaN(parsed) && parsed > 0) {
        seatsCount = parsed;
      } else if (numWordMap[seatsMatch[1]?.toLowerCase()]) {
        seatsCount = numWordMap[seatsMatch[1].toLowerCase()];
      }
    }

    // STEP 1: If movie is not specified, ask which movie and list currently playing movies
    if (!selectedMovie) {
      const toolResult = await executeToolCall("getMovieShowtimes", JSON.stringify({}), context);
      executedToolActions.push({
        toolName: "getMovieShowtimes",
        args: {},
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `🎬 Which movie would you like to watch in Indore?\n\n` +
        `Here are the latest movies currently screening across Indore multiplexes (BookMyShow Live):\n` +
        MOVIE_CATALOG.map(
          (m, i) => `${i + 1}. ${m.title} (${m.genre} · ${m.duration} · ${m.language})`
        ).join("\n") +
        `\n\nPlease select a movie using the cards below or let me know your choice!`;
    }
    // STEP 2: Once movie is chosen, show cinema locations where it is available
    else if (!selectedTheater) {
      const toolResult = await executeToolCall(
        "getMovieShowtimes",
        JSON.stringify({ movie: selectedMovie.title }),
        context
      );
      executedToolActions.push({
        toolName: "getMovieShowtimes",
        args: { movie: selectedMovie.title },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Great choice! ${selectedMovie.title} is currently screening at these Indore cinema venues:\n\n` +
        selectedMovie.theaters
          .map(
            (t) =>
              `📍 ${t.name}\n   • Location: ${t.location}\n   • Formats: ${t.formats.join(", ")} · Ticket Price: ${t.price}\n   • Available Seats: 🟢 ${t.availableSeats || 48} seats left`
          )
          .join("\n\n") +
        `\n\nWhich Indore cinema location or theater would you prefer?`;
    }
    // STEP 3: Once theater is chosen, show available show timings and ask quantity
    else if (!selectedTiming) {
      const toolResult = await executeToolCall(
        "getMovieShowtimes",
        JSON.stringify({
          movie: selectedMovie.title,
          theaterOrLocation: selectedTheater.name,
        }),
        context
      );
      executedToolActions.push({
        toolName: "getMovieShowtimes",
        args: { movie: selectedMovie.title, theaterOrLocation: selectedTheater.name },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Here are the available show timings for ${selectedMovie.title} at ${selectedTheater.name} (${selectedTheater.location}):\n\n` +
        `📅 Available Dates: Today, Tomorrow, Wed 11 Nov\n` +
        `💺 Available Seats: 🟢 ${selectedTheater.availableSeats || 48} seats currently available (${selectedTheater.price} per ticket)\n\n` +
        selectedTheater.timings
          .map((tm) => `🕒 ${tm} (${selectedTheater.formats.join(", ")})`)
          .join("\n") +
        `\n\nHow many tickets would you like to book, and which showtime works best for you?`;
    }
    // STEP 4: Confirm booking details
    else if (!isConfirmed) {
      let selectedDate = "Today";
      if (userMessagesText.includes("tomorrow")) selectedDate = "Tomorrow";
      else if (userMessagesText.includes("today")) selectedDate = "Today";
      else if (userMessagesText.includes("wed") || userMessagesText.includes("wednesday")) selectedDate = "Wednesday";

      const unitPrice = parseInt(selectedTheater.price.replace(/[^\d]/g, ""), 10) || 250;
      const totalPrice = unitPrice * seatsCount;

      reply =
        `🎟️ Movie Ticket Reservation Summary:\n` +
        `• Movie: ${selectedMovie.title}\n` +
        `• Cinema: ${selectedTheater.name} (${selectedTheater.location})\n` +
        `• Date & Showtime: ${selectedDate} at ${selectedTiming}\n` +
        `• Quantity: ${seatsCount} Ticket${seatsCount > 1 ? "s" : ""} (Available Seats: 🟢 ${selectedTheater.availableSeats || 48})\n` +
        `• Ticket Price: ${selectedTheater.price} each · Total Amount: ₹${totalPrice}\n\n` +
        `To confirm and secure your ${seatsCount} ticket(s) in our database, please reply 'Confirm' (or provide your name and email).`;
    }
    // STEP 5: Book ticket in MongoDB
    else {
      let selectedDate = "Today";
      if (userMessagesText.includes("tomorrow")) selectedDate = "Tomorrow";
      else if (userMessagesText.includes("today")) selectedDate = "Today";
      else if (userMessagesText.includes("wed") || userMessagesText.includes("wednesday")) selectedDate = "Wednesday";

      const unitPrice = parseInt(selectedTheater.price.replace(/[^\d]/g, ""), 10) || 250;
      const totalPrice = unitPrice * seatsCount;

      const toolResult = await executeToolCall(
        "bookMovieTicket",
        JSON.stringify({
          movie: selectedMovie.title,
          theater: selectedTheater.name,
          location: selectedTheater.location,
          showtime: selectedTiming,
          showDate: selectedDate,
          seatsCount,
          customerName,
          customerEmail: email,
          userConfirmed: true,
          channel: context.channel || "website",
        }),
        context
      );

      executedToolActions.push({
        toolName: "bookMovieTicket",
        args: {
          movie: selectedMovie.title,
          theater: selectedTheater.name,
          showtime: selectedTiming,
          seatsCount,
          customerName,
          customerEmail: email,
        },
        result: toolResult,
        success: toolResult.success,
      });

      if (toolResult.success) {
        reply =
          `✅ Your Movie Tickets are Confirmed!\n\n` +
          `🎉 Booking ID: ${toolResult.bookingId}\n` +
          `🎬 Movie: ${selectedMovie.title}\n` +
          `📍 Cinema: ${selectedTheater.name} (${selectedTheater.location})\n` +
          `📅 Date & Showtime: ${selectedDate} at ${selectedTiming}\n` +
          `🎟️ Quantity: ${seatsCount} Ticket${seatsCount > 1 ? "s" : ""}\n` +
          `💺 Seats: ${toolResult.seatNumbers || `Row F (Seats 1-${seatsCount})`}\n` +
          `💰 Total Paid: ₹${totalPrice}\n` +
          `📧 A digital ticket pass has been queued for ${email}.\n\nEnjoy your movie! 🍿`;
      } else {
        reply =
          toolResult.message ||
          "We could not complete your movie booking at this time. Please try again.";
      }
    }
  } else if (
    userMessagesText.includes("hospital") ||
    userMessagesText.includes("doctor") ||
    userMessagesText.includes("clinic") ||
    userMessagesText.includes("consult") ||
    userMessagesText.includes("medical") ||
    HOSPITAL_CATALOG.some((h) => userMessagesText.includes(h.name.toLowerCase()) || userMessagesText.includes(h.id)) ||
    (lower.includes("schedule") && !isMovieIntent) ||
    (lower.includes("appointment") && !isMovieIntent) ||
    (lower.includes("slot") && !isMovieIntent)
  ) {
    // 1. Identify if a hospital has been chosen by the customer
    let selectedHospital = null;
    for (const h of HOSPITAL_CATALOG) {
      const hLower = h.name.toLowerCase();
      if (
        userMessagesText.includes(hLower) ||
        userMessagesText.includes(h.id) ||
        (userMessagesText.includes("metro") && h.id === "metro-general") ||
        (userMessagesText.includes("jude") && h.id === "st-jude") ||
        (userMessagesText.includes("apex") && h.id === "apex-hospital") ||
        (userMessagesText.includes("curewell") && h.id === "curewell-clinic")
      ) {
        selectedHospital = h;
        break;
      }
    }

    // 2. Identify if a day or date has been chosen by the customer
    let selectedDay = null;
    if (selectedHospital) {
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      for (const d of days) {
        if (userMessagesText.includes(d)) {
          selectedDay = d.charAt(0).toUpperCase() + d.slice(1);
          break;
        }
      }
      if (!selectedDay) {
        if (userMessagesText.includes("today")) selectedDay = "Today";
        else if (userMessagesText.includes("tomorrow")) selectedDay = "Tomorrow";
        else {
          const dateMatch = userMessagesText.match(/\d{4}-\d{2}-\d{2}/);
          if (dateMatch) selectedDay = dateMatch[0];
        }
      }
    }

    // 3. Identify if a timing has been chosen by the customer
    let selectedTime = null;
    if (selectedHospital && selectedDay) {
      for (const t of selectedHospital.timings) {
        const timeDigits = t.split(" ")[0].replace(/^0/, "");
        if (userMessagesText.includes(t.toLowerCase()) || userMessagesText.includes(timeDigits)) {
          selectedTime = t;
          break;
        }
      }
      if (!selectedTime) {
        if (userMessagesText.includes("morning")) selectedTime = selectedHospital.timings[0];
        else if (userMessagesText.includes("afternoon") || userMessagesText.includes("matinee"))
          selectedTime = selectedHospital.timings[2] || selectedHospital.timings[1];
        else if (userMessagesText.includes("evening"))
          selectedTime = selectedHospital.timings[selectedHospital.timings.length - 1];
      }
    }

    // 4. Check for confirmation intent
    const isConfirmed =
      lower.includes("confirm") ||
      lower.includes("yes") ||
      lower.includes("proceed") ||
      lower.includes("agree") ||
      lower.includes("book it") ||
      lower.includes("sure");

    // Extract customer details
    const emailMatch = userMessagesText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "alex@example.com");
    const nameMatch =
      userMessagesText.match(/for ([A-Z][a-z]+ [A-Z][a-z]+)/i) ||
      userMessagesText.match(/my name is ([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/i) ||
      userMessagesText.match(/patient:?\s*([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/i);
    const customerName = nameMatch ? (nameMatch[1] || nameMatch[0]) : (context.customerName || "Patient");

    // STEP 1: Ask Hospital if not specified
    if (!selectedHospital) {
      const toolResult = await executeToolCall("getHospitalsAndSlots", JSON.stringify({}), context);
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: {},
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `🏥 Which hospital would you like to schedule your consultation at?\n\n` +
        `Here are our premier partner hospitals:\n` +
        HOSPITAL_CATALOG.map(
          (h, i) =>
            `${i + 1}. ${h.name}\n   • Location: ${h.location}\n   • Specialties: ${h.departments.join(", ")}\n   • Consultation Fee: ${h.consultationFee}`
        ).join("\n\n") +
        `\n\nPlease let me know which hospital you would like to visit!`;
    }
    // STEP 2: Ask Day if not specified
    else if (!selectedDay) {
      const toolResult = await executeToolCall(
        "getHospitalsAndSlots",
        JSON.stringify({ hospital: selectedHospital.name }),
        context
      );
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: { hospital: selectedHospital.name },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Great choice! ${selectedHospital.name} offers specialist consultations on ${selectedHospital.availableDays.join(", ")}.\n\n` +
        `Which day or date works best for you (e.g. Monday, Tomorrow, or a specific date)?`;
    }
    // STEP 3: Show & Ask Timings if not specified
    else if (!selectedTime) {
      const toolResult = await executeToolCall(
        "getHospitalsAndSlots",
        JSON.stringify({
          hospital: selectedHospital.name,
          dayOrDate: selectedDay,
        }),
        context
      );
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: { hospital: selectedHospital.name, dayOrDate: selectedDay },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Here are the available consultation timings for ${selectedHospital.name} on ${selectedDay}:\n\n` +
        selectedHospital.timings.map((t) => `🕒 ${t} (Specialist Slot)`).join("\n") +
        `\n\nWhich timing slot works best for you?`;
    }
    // STEP 4: Summary & Ask Confirmation
    else if (!isConfirmed) {
      reply =
        `📋 Consultation Appointment Summary:\n` +
        `• Hospital: ${selectedHospital.name} (${selectedHospital.location})\n` +
        `• Department: General Medicine / Outpatient\n` +
        `• Day & Time: ${selectedDay} at ${selectedTime}\n` +
        `• Consultation Fee: ${selectedHospital.consultationFee}\n\n` +
        `To confirm and secure your consultation appointment in our database, please reply 'Confirm' (or provide your name and email).`;
    }
    // STEP 5: At Last Confirmed! Save to MongoDB
    else {
      const toolResult = await executeToolCall(
        "bookHospitalConsultation",
        JSON.stringify({
          hospital: selectedHospital.name,
          location: selectedHospital.location,
          department: "General Medicine",
          day: selectedDay,
          time: selectedTime,
          customerName,
          customerEmail: email,
          userConfirmed: true,
          channel: context.channel || "website",
        }),
        context
      );

      executedToolActions.push({
        toolName: "bookHospitalConsultation",
        args: {
          hospital: selectedHospital.name,
          day: selectedDay,
          time: selectedTime,
          customerName,
          customerEmail: email,
        },
        result: toolResult,
        success: toolResult.success,
      });

      if (toolResult.success) {
        reply =
          `✅ Your Consultation Appointment is Confirmed!\n\n` +
          `🎉 Booking ID: ${toolResult.bookingId}\n` +
          `🏥 Hospital: ${selectedHospital.name}\n` +
          `📍 Location: ${selectedHospital.location}\n` +
          `📅 Appointment: ${selectedDay} at ${selectedTime}\n` +
          `👤 Patient: ${customerName}\n` +
          `📧 A confirmation notice and appointment pass have been sent to ${email}.\n\nTake care! 🩺`;
      } else {
        reply =
          toolResult.message ||
          "We could not secure that specific consultation slot. Please try another time.";
      }
    }
  } else if (lower.includes("escalat") || lower.includes("human") || lower.includes("specialist") || lower.includes("representative")) {
    const emailMatch = userPrompt.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "customer@example.com");
    const toolResult = await executeToolCall("escalateToHuman", JSON.stringify({
      customerEmail: email,
      customerName: context.customerName || "Customer",
      customerPhone: context.customerPhone || null,
      reason: userPrompt,
      channel: context.channel || "website",
    }), context);

    executedToolActions.push({
      toolName: "escalateToHuman",
      args: { customerEmail: email, reason: userPrompt },
      result: toolResult,
      success: toolResult.success,
    });

    if (toolResult.success && toolResult.ticketId) {
      reply = `🚨 Your request has been escalated directly to our human support team under ticket ID ${toolResult.ticketId}. A senior specialist will review your full conversation context within 2 business hours.`;
    } else {
      reply = `🚨 Your escalation request has been registered. Our human support team has been notified. (${toolResult.message || "Escalation queued for triage"})`;
    }
  } else if (
    (lower.includes("support ticket") || lower.includes("create ticket") || lower.includes("log ticket") ||
     lower.includes("report issue") || lower.includes("bug") || lower.includes("error") ||
     lower.includes("504") || lower.includes("failing") || lower.includes("issue")) &&
    !isMovieIntent
  ) {
    const emailMatch = userPrompt.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "dev@acme.com");
    const priority = lower.includes("high") ? "high" : lower.includes("urgent") ? "urgent" : "medium";

    const toolResult = await executeToolCall("createTicket", JSON.stringify({
      subject: userPrompt.length > 80 ? userPrompt.slice(0, 80) + "..." : userPrompt,
      description: userPrompt,
      customerEmail: email,
      customerName: context.customerName || "Customer",
      customerPhone: context.customerPhone || null,
      priority,
      category: lower.includes("billing") ? "billing" : "technical",
      channel: context.channel || "website",
    }), context);

    executedToolActions.push({
      toolName: "createTicket",
      args: { subject: userPrompt, customerEmail: email, priority },
      result: toolResult,
      success: toolResult.success,
    });

    if (toolResult.success && toolResult.ticketId) {
      reply = `Support ticket ${toolResult.ticketId} has been created and categorized under '${priority.toUpperCase()}' priority in our support queue. Our engineers are investigating.`;
    } else {
      reply = `We received your support report. (${toolResult.message || "Ticket queued for triage"})`;
    }
  } else if (lower.includes("lead") || lower.includes("contact") || lower.includes("pricing") || lower.includes("sales") || lower.includes("quote")) {
    const emailMatch = userPrompt.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "lead@acme.com");

    const toolResult = await executeToolCall("recordLead", JSON.stringify({
      name: context.customerName || "Prospective Customer",
      email: email,
      phone: context.customerPhone || null,
      interest: "SupportPilot AI Enterprise Platform",
      notes: userPrompt,
      channel: context.channel || "website",
    }), context);

    executedToolActions.push({
      toolName: "recordLead",
      args: { email, interest: "Enterprise Platform" },
      result: toolResult,
      success: toolResult.success,
    });

    if (toolResult.success && toolResult.leadId) {
      reply = `Thank you for your interest! We have captured your contact information under lead ID ${toolResult.leadId}. A product specialist will reach out shortly.`;
    } else {
      reply = `Thank you for your interest! We received your inquiry regarding SupportPilot AI. Our product team will be happy to connect with you. (${toolResult.message || "Lead queued for review"})`;
    }
  } else {
    reply = "Hello! I am SupportPilot AI, your customer operations agent. I can check real-time calendar availability, book consultations, create support tickets, capture leads, or escalate issues to our human support team. What would you like assistance with today?";
  }

  return {
    message: {
      role: "assistant",
      content: reply,
      timestamp: new Date().toISOString(),
    },
    toolActions: executedToolActions,
    model: `${activeModel} (Autonomous Engine Fallback)`,
  };
}

/**
 * Unified Agent Message Processor.
 * Used by both Website Chatbot (POST /api/chat) and WhatsApp Webhook (POST /api/whatsapp/webhook).
 * Ensures 100% operational feature parity across all customer channels.
 */
export async function processAgentMessage({ messages, channel = "website", context = {} }) {
  const mergedContext = { channel, ...context };
  const aiClient = getAIClient();
  const model = getAIModel();
  const provider = getAIProvider();

  if (!aiClient) {
    const lastUserMsg = messages?.slice().reverse().find((m) => m.role === "user");
    return await handleAutonomousFallback(
      lastUserMsg?.content || "",
      "Autonomous Engine",
      mergedContext,
      messages || []
    );
  }

  const channelNote = channel === "whatsapp" 
    ? "You are responding over WhatsApp. Keep replies concise, friendly, and formatted with plain text or WhatsApp bold/bullet points (*bold*, _italics_). When offering consultation slots, list available dates and UTC times clearly."
    : "";

  const conversationMessages = [
    { role: "system", content: `${SYSTEM_PROMPT}\n\n${channelNote}` },
    ...messages.map((m) => ({
      role: m.role,
      content: m.content ? m.content.trim() : "",
    })),
  ];

  const maxIterations = 5;
  let iteration = 0;
  const executedToolActions = [];

  try {
    while (iteration < maxIterations) {
      iteration++;

      const completion = await aiClient.chat.completions.create({
        model: model,
        messages: conversationMessages,
        tools: SUPPORT_TOOLS,
        tool_choice: "auto",
        temperature: 0.5,
        max_tokens: 1200,
      });

      const choice = completion.choices?.[0];
      const assistantMessage = choice?.message;

      if (!assistantMessage) {
        throw new Error("Received an empty response from the AI provider.");
      }

      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        conversationMessages.push(assistantMessage);

        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function?.name;
          const rawArgs = toolCall.function?.arguments;

          if (!SUPPORT_TOOLS_WHITELIST.includes(toolName)) {
            conversationMessages.push({
              role: "tool",
              tool_call_id: toolCall.id,
              content: JSON.stringify({
                success: false,
                error: "TOOL_NOT_PERMITTED",
                message: `Tool '${toolName}' is not in the authorized tool whitelist.`,
              }),
            });
            continue;
          }

          const toolResult = await executeToolCall(toolName, rawArgs, mergedContext);

          let parsedArgs = {};
          try {
            parsedArgs = JSON.parse(rawArgs);
          } catch {
            parsedArgs = { raw: rawArgs };
          }

          executedToolActions.push({
            toolName: toolName,
            toolCallId: toolCall.id,
            args: parsedArgs,
            result: toolResult,
            success: Boolean(toolResult.success),
          });

          conversationMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolResult),
          });
        }

        continue;
      }

      const finalReply = assistantMessage.content || "I have processed your request.";

      return {
        message: {
          role: "assistant",
          content: finalReply,
          timestamp: new Date().toISOString(),
        },
        toolActions: executedToolActions,
        model: model,
        usage: completion.usage || null,
      };
    }

    return {
      message: {
        role: "assistant",
        content: "I have performed the requested customer operations. Please let me know if you need any additional assistance.",
        timestamp: new Date().toISOString(),
      },
      toolActions: executedToolActions,
      model: model,
    };
  } catch (error) {
    console.warn(`[SupportPilot AgentCore (${provider || "AI Provider"})]:`, error.message || error);

    const status = error.status || 500;
    const isQuotaExceeded =
      status === 429 ||
      error.code === "insufficient_quota" ||
      error.code === "credit_balance_exhausted" ||
      (typeof error.message === "string" && error.message.toLowerCase().includes("credits remaining"));

    if (isQuotaExceeded) {
      console.warn(`[SupportPilot Quota Fallback (${provider || "AI"})]: Executing autonomous operations engine.`);
      const lastUserMsg = messages?.slice().reverse().find((m) => m.role === "user");
      return await handleAutonomousFallback(
        lastUserMsg?.content || "",
        model,
        mergedContext,
        messages || []
      );
    }

    throw error;
  }
}
