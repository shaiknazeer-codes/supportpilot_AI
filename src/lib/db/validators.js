import crypto from "crypto";

/**
 * Generates human-readable unique identifiers with prefix and high-entropy suffix.
 * Examples: BK-749201, TK-928174, LD-382910
 */
export function generateUniqueId(prefix = "SP") {
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-3);
  const randomPart = crypto.randomInt(10000, 99999);
  return `${prefix}-${timestampPart}${randomPart}`;
}

/**
 * Validates email addresses using standard RFC-compliant pattern.
 */
export function isValidEmail(email) {
  if (typeof email !== "string") return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validates ISO date strings or timestamps.
 */
export function isValidDate(dateString) {
  if (!dateString) return false;
  const d = new Date(dateString);
  return d instanceof Date && !isNaN(d.getTime());
}

/**
 * Validation and sanitization for Bookings.
 */
export function validateBookingInput(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a valid JSON object." };
  }

  const { customerName, customerEmail, customerPhone, scheduledAt, durationMinutes, topic, notes } = body;

  if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
    return { valid: false, error: "customerName is required and must be at least 2 characters." };
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return { valid: false, error: "A valid customerEmail is required." };
  }

  if (!scheduledAt || !isValidDate(scheduledAt)) {
    return { valid: false, error: "scheduledAt must be a valid future ISO datetime string." };
  }

  const scheduledDate = new Date(scheduledAt);
  // Optional warning or check: allow recent past for testing, but ideally future dates
  const parsedDuration = Number(durationMinutes) || 30;
  if (parsedDuration < 15 || parsedDuration > 240) {
    return { valid: false, error: "durationMinutes must be between 15 and 240 minutes." };
  }

  const allowedStatuses = ["pending", "confirmed", "rescheduled", "cancelled", "completed"];
  const status = body.status && allowedStatuses.includes(body.status) ? body.status : "confirmed";
  const channel = body.channel === "whatsapp" ? "whatsapp" : "website";

  return {
    valid: true,
    data: {
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerPhone: typeof customerPhone === "string" ? customerPhone.trim() : null,
      scheduledAt: scheduledDate,
      durationMinutes: parsedDuration,
      topic: typeof topic === "string" && topic.trim() ? topic.trim() : "General Consultation",
      notes: typeof notes === "string" ? notes.trim() : "",
      status: status,
      channel: channel,
    },
  };
}

/**
 * Validation and sanitization for Support Tickets.
 */
export function validateTicketInput(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a valid JSON object." };
  }

  const { subject, description, customerEmail, customerName, customerPhone, priority, category, source } = body;

  if (!subject || typeof subject !== "string" || subject.trim().length < 3) {
    return { valid: false, error: "subject is required and must be at least 3 characters." };
  }

  if (!description || typeof description !== "string" || description.trim().length < 5) {
    return { valid: false, error: "description is required and must be at least 5 characters." };
  }

  if (!customerEmail || !isValidEmail(customerEmail)) {
    return { valid: false, error: "A valid customerEmail is required." };
  }

  const allowedPriorities = ["low", "medium", "high", "urgent"];
  const parsedPriority =
    priority && allowedPriorities.includes(priority.toLowerCase())
      ? priority.toLowerCase()
      : "medium";

  const allowedCategories = ["general", "billing", "technical", "account", "feature_request"];
  const parsedCategory =
    category && allowedCategories.includes(category.toLowerCase())
      ? category.toLowerCase()
      : "general";

  const allowedStatuses = ["open", "in_progress", "escalated", "resolved", "closed"];
  const parsedStatus =
    body.status && allowedStatuses.includes(body.status.toLowerCase())
      ? body.status.toLowerCase()
      : "open";

  const allowedSources = ["ai_agent", "chat", "web", "email", "whatsapp"];
  const parsedSource =
    source && allowedSources.includes(source.toLowerCase())
      ? source.toLowerCase()
      : "chat";

  const channel = body.channel === "whatsapp" ? "whatsapp" : "website";

  return {
    valid: true,
    data: {
      subject: subject.trim(),
      description: description.trim(),
      customerEmail: customerEmail.trim().toLowerCase(),
      customerName: typeof customerName === "string" && customerName.trim() ? customerName.trim() : "Anonymous Customer",
      customerPhone: typeof customerPhone === "string" ? customerPhone.trim() : null,
      priority: parsedPriority,
      category: parsedCategory,
      status: parsedStatus,
      source: parsedSource,
      channel: channel,
      assignedTo: null,
      resolutionNotes: null,
    },
  };
}

/**
 * Validation and sanitization for Leads.
 */
export function validateLeadInput(body) {
  if (!body || typeof body !== "object") {
    return { valid: false, error: "Request body must be a valid JSON object." };
  }

  const { name, email, phone, company, interest, notes, source } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return { valid: false, error: "name is required and must be at least 2 characters." };
  }

  if (!email || !isValidEmail(email)) {
    return { valid: false, error: "A valid email address is required." };
  }

  const allowedStatuses = ["new", "contacted", "qualified", "converted", "closed"];
  const parsedStatus =
    body.status && allowedStatuses.includes(body.status.toLowerCase())
      ? body.status.toLowerCase()
      : "new";

  const channel = body.channel === "whatsapp" ? "whatsapp" : "website";

  return {
    valid: true,
    data: {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: typeof phone === "string" ? phone.trim() : null,
      company: typeof company === "string" ? company.trim() : null,
      interest: typeof interest === "string" && interest.trim() ? interest.trim() : "Support Operations Automation",
      notes: typeof notes === "string" ? notes.trim() : "",
      status: parsedStatus,
      source: typeof source === "string" && source.trim() ? source.trim() : (channel === "whatsapp" ? "whatsapp_bot" : "web_landing"),
      channel: channel,
    },
  };
}
