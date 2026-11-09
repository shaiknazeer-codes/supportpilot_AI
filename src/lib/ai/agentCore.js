import { getAIClient, getAIModel, getAIProvider } from "./client.js";
import { SYSTEM_PROMPT } from "./prompts.js";
import { SUPPORT_TOOLS, SUPPORT_TOOLS_WHITELIST } from "./tools.js";
import { executeToolCall } from "./toolExecutors.js";
import { MOVIE_CATALOG, HOSPITAL_CATALOG, HEALTHCARE_SPECIALTIES } from "./knowledgeBase.js";

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

  // 1. Detect Support Ticket Logging Intent (Bugs, errors, gateway timeouts, system incidents)
  const isSupportTicketIntent =
    userMessagesText.includes("support ticket") ||
    userMessagesText.includes("raise a ticket") ||
    userMessagesText.includes("create a ticket") ||
    userMessagesText.includes("log a ticket") ||
    userMessagesText.includes("open a ticket") ||
    userMessagesText.includes("file a ticket") ||
    userMessagesText.includes("gateway timeout") ||
    userMessagesText.includes("504") ||
    userMessagesText.includes("webhook") ||
    (userMessagesText.includes("ticket") && (
      userMessagesText.includes("issue") ||
      userMessagesText.includes("error") ||
      userMessagesText.includes("bug") ||
      userMessagesText.includes("fail") ||
      userMessagesText.includes("broken") ||
      userMessagesText.includes("dev@") ||
      userMessagesText.includes("urgent") ||
      userMessagesText.includes("escalat")
    ));

  // 2. Detect Movie Ticket Booking Intent
  const isMovieIntent =
    !isSupportTicketIntent &&
    (
      userMessagesText.includes("movie") ||
      userMessagesText.includes("cinema") ||
      userMessagesText.includes("theatre") ||
      userMessagesText.includes("theater") ||
      userMessagesText.includes("showtime") ||
      userMessagesText.includes("seat") ||
      userMessagesText.includes("book ticket") ||
      userMessagesText.includes("book tickets") ||
      userMessagesText.includes("ticket booking") ||
      userMessagesText.includes("tickets booking") ||
      /(?:book|buy|reserve|purchase|get|want|need)\s+(?:a\s+|me\s+|the\s+|some\s+|\d+\s+)?(?:movie\s+|cinema\s+|film\s+)?tickets?/i.test(userMessagesText) ||
      /(?:ticket|tickets)\s+booking/i.test(userMessagesText) ||
      /booking\s+(?:a\s+|the\s+)?tickets?/i.test(userMessagesText) ||
      MOVIE_CATALOG.some((m) => {
        const titleLower = m.title.toLowerCase();
        const firstWord = titleLower.split(/[: ]/)[0];
        return (
          userMessagesText.includes(titleLower) ||
          userMessagesText.includes(m.id) ||
          (firstWord.length > 3 && userMessagesText.includes(firstWord))
        );
      })
    );

  // 3. Detect Healthcare / Doctor Appointment Intent
  const isHealthcareIntent =
    (
      userMessagesText.includes("hospital") ||
      userMessagesText.includes("doctor") ||
      userMessagesText.includes("clinic") ||
      userMessagesText.includes("consult") ||
      userMessagesText.includes("medical") ||
      userMessagesText.includes("health") ||
      userMessagesText.includes("skin") ||
      userMessagesText.includes("derma") ||
      userMessagesText.includes("heart") ||
      userMessagesText.includes("cardio") ||
      userMessagesText.includes("ortho") ||
      userMessagesText.includes("bone") ||
      userMessagesText.includes("physician") ||
      userMessagesText.includes("neuro") ||
      userMessagesText.includes("pediatric") ||
      userMessagesText.includes("gynec") ||
      /\bent\b/i.test(userMessagesText) ||
      /\beye\b/i.test(userMessagesText) ||
      userMessagesText.includes("dental") ||
      userMessagesText.includes("appointment") ||
      userMessagesText.includes("patient") ||
      /(?:book|schedule|make|need|want|get|set up)\s+(?:an?\s+)?appointment/i.test(userMessagesText) ||
      /appointment\s+booking/i.test(userMessagesText) ||
      HOSPITAL_CATALOG.some(
        (h) => userMessagesText.includes(h.name.toLowerCase()) || userMessagesText.includes(h.id)
      ) ||
      ((userMessagesText.includes("schedule") || userMessagesText.includes("appointment") || userMessagesText.includes("slot")) && !isMovieIntent)
    );

  // 4. Detect Dual Intent when user asks about both (e.g. "i want to book ticket or book appointment")
  const isDualBookingIntent =
    isMovieIntent &&
    isHealthcareIntent &&
    (userMessagesText.includes(" or ") || userMessagesText.includes(" / ") || userMessagesText.includes(" and ") || userMessagesText.includes("both"));

  if (isDualBookingIntent) {
    reply =
      "I can help you with both!\n\n" +
      "1. 🎬 Movie Ticket Booking: View currently running blockbusters across Indore multiplexes, select seats, and book tickets.\n" +
      "2. 🏥 Doctor Appointments: Schedule a consultation with medical specialists at premier Indore hospitals.\n\n" +
      "Which one would you like to book right now — Movie Tickets or Doctor Appointment?";
  } else if (isMovieIntent && !lower.includes("bug") && !lower.includes("error") && !lower.includes("504")) {
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

    // Extract customer details and seat choices
    const emailMatch = userMessagesText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "customer@example.com");
    const nameMatch =
      userMessagesText.match(/for ([A-Z][a-z]+ [A-Z][a-z]+)/i) ||
      userMessagesText.match(/my name is ([A-Z][a-z]+ [A-Z][a-z]+|[A-Z][a-z]+)/i);
    const customerName = nameMatch ? (nameMatch[1] || nameMatch[0]) : (context.customerName || "Movie Guest");
    
    // Extract chosen seat identifiers (e.g., E4, E5, D3, F2)
    const seatMatches = [...userMessagesText.matchAll(/\b([A-Fa-f][1-8])\b/g)].map((m) => m[1].toUpperCase());
    const uniqueChosenSeats = Array.from(new Set(seatMatches));

    let seatsCount = 2;
    let assignedSeats = "E4, E5";

    if (uniqueChosenSeats.length > 0) {
      seatsCount = uniqueChosenSeats.length;
      assignedSeats = uniqueChosenSeats.join(", ");
    } else {
      const numWordMap = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
      const seatsMatch =
        userMessagesText.match(/(\d+)\s*(tickets?|seats?|people|persons?)/i) ||
        userMessagesText.match(/(one|two|three|four|five|six|seven|eight|nine|ten)\s*(tickets?|seats?|people|persons?)/i) ||
        userMessagesText.match(/quantity\s*[:=]?\s*(\d+)/i) ||
        userMessagesText.match(/(\d+)\s*(pass|passes)/i);
      if (seatsMatch) {
        const parsed = parseInt(seatsMatch[1], 10);
        if (!isNaN(parsed) && parsed > 0) {
          seatsCount = parsed;
        } else if (numWordMap[seatsMatch[1]?.toLowerCase()]) {
          seatsCount = numWordMap[seatsMatch[1].toLowerCase()];
        }
      }
      const defaultSeats = ["E4", "E5", "E3", "E6", "E2", "E7", "E1", "E8"];
      assignedSeats = defaultSeats.slice(0, seatsCount).join(", ");
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
        "🎬 Which movie would you like to watch in Indore?\n\n" +
        "Please select a movie below to view available showtimes, multiplex venues, and seat availability:";
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
        `Great choice! ${selectedMovie.title} is currently screening across premier Indore multiplexes. Please choose your preferred theater and showtime below:`;
    }
    // STEP 3: Once theater is chosen, show available show timings and seat layout
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
        `💺 Available Seats: 🟢 ${selectedTheater.availableSeats || 40} seats currently open (${selectedTheater.price} per ticket)\n` +
        `• Row F (VIP Recliner): F2, F3, F4, F5, F6, F7, F8\n` +
        `• Row E (Prime Club): E1, E2, E3, E4, E5, E6, E7, E8\n` +
        `• Row D (Gold Executive): D3, D4, D5, D6, D7, D8\n` +
        `• Row C (Gold Executive): C1, C2, C3, C4, C5, C6, C8\n\n` +
        selectedTheater.timings
          .map((tm) => `🕒 ${tm} (${selectedTheater.formats.join(", ")})`)
          .join("\n") +
        `\n\nPlease select your preferred showtime and choose your seats using the interactive seat map below, or reply with your seats (e.g. E4 and E5)!`;
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
        `• Selected Seats: ${assignedSeats} (${seatsCount} Ticket${seatsCount > 1 ? "s" : ""})\n` +
        `• Ticket Price: ${selectedTheater.price} each · Total Amount: ₹${totalPrice}\n\n` +
        `To confirm and secure your seats (${assignedSeats}) in our database, please reply 'Confirm' (or provide your name and email).`;
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
          seatNumbers: assignedSeats,
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
          seatNumbers: assignedSeats,
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
          `💺 Confirmed Seats: ${assignedSeats}\n` +
          `💰 Total Paid: ₹${totalPrice}\n` +
          `📧 A digital ticket pass has been queued for ${email}.\n\nEnjoy your movie! 🍿`;
      } else {
        reply =
          toolResult.message ||
          "We could not complete your movie booking at this time. Please try again.";
      }
    }
  } else if (isHealthcareIntent) {
    // Helper to test whole word or token safely
    const matchSpecialtyKeyword = (text, kw) => {
      if (!text || !kw) return false;
      if (kw.length <= 4) {
        return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:s)?\\b`, "i").test(text);
      }
      return text.toLowerCase().includes(kw.toLowerCase());
    };

    // 1. Identify if a medical field/specialty has been chosen by the customer
    let selectedSpecialty = null;
    for (const s of HEALTHCARE_SPECIALTIES) {
      if (
        matchSpecialtyKeyword(userMessagesText, s.id) ||
        matchSpecialtyKeyword(userMessagesText, s.shortName) ||
        userMessagesText.includes(s.name.toLowerCase()) ||
        s.keywords.some((k) => matchSpecialtyKeyword(userMessagesText, k))
      ) {
        selectedSpecialty = s;
        break;
      }
    }

    // 2. Identify if an Indore hospital has been chosen by the customer
    let selectedHospital = null;
    for (const h of HOSPITAL_CATALOG) {
      const hLower = h.name.toLowerCase();
      if (
        userMessagesText.includes(hLower) ||
        userMessagesText.includes(h.id) ||
        (userMessagesText.includes("bombay") && h.id === "bombay-hospital") ||
        (userMessagesText.includes("medanta") && h.id === "medanta-indore") ||
        (userMessagesText.includes("chl") && h.id === "care-chl") ||
        (userMessagesText.includes("apollo") && h.id === "apollo-indore") ||
        (userMessagesText.includes("choithram") && h.id === "choithram-hospital") ||
        (userMessagesText.includes("shalby") && h.id === "shalby-hospital") ||
        (userMessagesText.includes("jupiter") && h.id === "vishesh-jupiter") ||
        (userMessagesText.includes("vishesh") && h.id === "vishesh-jupiter")
      ) {
        selectedHospital = h;
        break;
      }
    }

    // 3. Identify if a day or date has been chosen by the customer
    let selectedDay = null;
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
      else if (userMessagesText.includes("wed")) selectedDay = "Wed, 11 Nov";
      else if (userMessagesText.includes("thu")) selectedDay = "Thu, 12 Nov";
      else {
        const dateMatch = userMessagesText.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) selectedDay = dateMatch[0];
      }
    }

    // 4. Identify if a timing has been chosen by the customer
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
        else if (userMessagesText.includes("afternoon"))
          selectedTime = selectedHospital.timings[2] || selectedHospital.timings[1];
        else if (userMessagesText.includes("evening"))
          selectedTime = selectedHospital.timings[selectedHospital.timings.length - 1];
      }
    }

    // Determine Doctor and Department
    const deptName = selectedSpecialty ? selectedSpecialty.name : "General Medicine / Physician";
    let selectedDoctor = "Specialist Consultant";
    if (selectedHospital && selectedHospital.doctors) {
      const matchKey = Object.keys(selectedHospital.doctors).find((k) =>
        selectedSpecialty
          ? k.toLowerCase().includes(selectedSpecialty.shortName.toLowerCase()) ||
            k.toLowerCase().includes(selectedSpecialty.id)
          : true
      );
      if (matchKey) {
        selectedDoctor = selectedHospital.doctors[matchKey];
      } else {
        selectedDoctor = Object.values(selectedHospital.doctors)[0];
      }
    }

    // 5. Check for confirmation intent
    const isConfirmed =
      lower.includes("confirm") ||
      lower.includes("yes") ||
      lower.includes("proceed") ||
      lower.includes("agree") ||
      lower.includes("book it") ||
      lower.includes("sure");

    // Extract customer details
    const emailMatch = userMessagesText.match(/[\w.-]+@[\w.-]+\.\w+/);
    const email = emailMatch ? emailMatch[0] : (context.customerEmail || "patient@example.com");
    const nameMatch =
      userMessagesText.match(/patient(?:\s+name)?(?:\s+is)?[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
      userMessagesText.match(/(?:my )?name is ([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i) ||
      userMessagesText.match(/for ([A-Z][a-z]+ [A-Z][a-z]+)/i);
    let customerName = "Patient";
    if (nameMatch) {
      const raw = nameMatch[1] || nameMatch[0];
      customerName = raw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    } else if (context.customerName) {
      customerName = context.customerName;
    }

    // STEP 1: Ask Medical Field & Hospital if neither is specified
    if (!selectedHospital && !selectedSpecialty) {
      const toolResult = await executeToolCall("getHospitalsAndSlots", JSON.stringify({}), context);
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: {},
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        "🏥 In which medical field or doctor specialty would you like to book an appointment in Indore?\n\n" +
        "Please select your preferred medical field and Indore hospital below to check doctor availability and schedule your consultation:";
    }
    // STEP 2A: If specialty is specified but hospital is not
    else if (selectedSpecialty && !selectedHospital) {
      const matchingHospitals = HOSPITAL_CATALOG.filter((h) =>
        h.departments.some(
          (d) =>
            d.toLowerCase().includes(selectedSpecialty.shortName.toLowerCase()) ||
            d.toLowerCase().includes(selectedSpecialty.id)
        )
      );
      const hospitalsToList = matchingHospitals.length > 0 ? matchingHospitals : HOSPITAL_CATALOG;

      const toolResult = await executeToolCall(
        "getHospitalsAndSlots",
        JSON.stringify({ department: selectedSpecialty.name }),
        context
      );
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: { department: selectedSpecialty.name },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Great! Please select your preferred Indore hospital and consultation timing below for your ${selectedSpecialty.shortName} appointment:`;
    }
    // STEP 2B: If hospital is specified but specialty is not
    else if (selectedHospital && !selectedSpecialty) {
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
        `Excellent choice! Please select your preferred medical specialty and consultation timing at ${selectedHospital.name} below:`;
    }
    // STEP 3: Both hospital and specialty known, ask day/date
    else if (!selectedDay) {
      const toolResult = await executeToolCall(
        "getHospitalsAndSlots",
        JSON.stringify({
          hospital: selectedHospital.name,
          department: selectedSpecialty.name,
        }),
        context
      );
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: { hospital: selectedHospital.name, department: selectedSpecialty.name },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Great! ${selectedDoctor} is available for consultations at ${selectedHospital.name} on ${selectedHospital.availableDays.join(", ")}.\n\n` +
        `📅 Available Dates: Today, Tomorrow, Wed 11 Nov, Thu 12 Nov\n` +
        `• Location: ${selectedHospital.location}\n` +
        `• Consultation Fee: ${selectedHospital.consultationFee}\n\n` +
        `Which day or date works best for your appointment?`;
    }
    // STEP 4: Day known, ask timing slot
    else if (!selectedTime) {
      const toolResult = await executeToolCall(
        "getHospitalsAndSlots",
        JSON.stringify({
          hospital: selectedHospital.name,
          department: selectedSpecialty.name,
          dayOrDate: selectedDay,
        }),
        context
      );
      executedToolActions.push({
        toolName: "getHospitalsAndSlots",
        args: {
          hospital: selectedHospital.name,
          department: selectedSpecialty.name,
          dayOrDate: selectedDay,
        },
        result: toolResult,
        success: toolResult.success,
      });

      reply =
        `Here are the available consultation timings for ${selectedDoctor} (${selectedSpecialty.name}) at ${selectedHospital.name} on ${selectedDay}:\n\n` +
        `• Location: ${selectedHospital.location}\n` +
        `• Consultation Fee: ${selectedHospital.consultationFee}\n\n` +
        selectedHospital.timings.map((t) => `🕒 ${t} (OPD Specialist Slot)`).join("\n") +
        `\n\nWhich timing slot works best for you?`;
    }
    // STEP 5: Summary & Confirmation
    else if (!isConfirmed) {
      reply =
        `📋 Doctor Consultation Appointment Summary:\n` +
        `• Hospital: ${selectedHospital.name} (${selectedHospital.location})\n` +
        `• Medical Field: ${deptName}\n` +
        `• Specialist: ${selectedDoctor}\n` +
        `• Date & Time: ${selectedDay} at ${selectedTime}\n` +
        `• Consultation Fee: ${selectedHospital.consultationFee}\n\n` +
        `To confirm and secure your doctor consultation appointment in our database, please reply 'Confirm' (or provide your name and email).`;
    }
    // STEP 6: Execute booking in MongoDB
    else {
      const toolResult = await executeToolCall(
        "bookHospitalConsultation",
        JSON.stringify({
          hospital: selectedHospital.name,
          location: selectedHospital.location,
          department: deptName,
          doctor: selectedDoctor,
          consultationFee: selectedHospital.consultationFee,
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
          department: deptName,
          doctor: selectedDoctor,
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
          `✅ Your Doctor Consultation is Confirmed!\n\n` +
          `🎉 Booking ID: ${toolResult.bookingId}\n` +
          `🏥 Hospital: ${selectedHospital.name}\n` +
          `📍 Location: ${selectedHospital.location}\n` +
          `🩺 Specialist: ${selectedDoctor} (${deptName})\n` +
          `📅 Appointment: ${selectedDay} at ${selectedTime}\n` +
          `💰 Consultation Fee: ${selectedHospital.consultationFee}\n` +
          `👤 Patient: ${customerName}\n` +
          `📧 A digital consultation pass and appointment details have been sent to ${email}.\n\nTake care! 🩺`;
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
     lower.includes("open a ticket") || lower.includes("file a ticket") || isSupportTicketIntent ||
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
    model: "SupportPilot AI",
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
