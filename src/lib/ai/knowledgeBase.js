/**
 * Editable FAQ Knowledge Base for SupportPilot AI.
 * Supplies ground-truth operational facts for customer inquiries.
 */
export const KNOWLEDGE_BASE = {
  organization: {
    name: "SupportPilot AI",
    tagline: "Listen. Understand. Act. Resolve.",
    description:
      "SupportPilot AI is an autonomous customer operations platform that manages multi-channel support inquiries, schedules appointments, logs support tickets, captures leads, and escalates complex issues to human specialists.",
  },
  operatingHours: {
    days: "Monday through Friday",
    hours: "9:00 AM to 5:00 PM UTC",
    standardSlotDurations: "30 minutes or 45 minutes",
    timezone: "UTC",
  },
  servicesAndCapabilities: [
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
