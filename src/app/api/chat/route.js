import { NextResponse } from "next/server";
import { processAgentMessage } from "@/lib/ai/agentCore";
import { getAIProvider, getAIModel } from "@/lib/ai/client";

/**
 * Validates the chat message history array.
 * Ensures each message has a recognized role and non-empty content.
 */
function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return { valid: false, error: "The 'messages' field must be a non-empty array." };
  }

  const validRoles = ["user", "assistant", "system", "tool"];

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    if (!msg || typeof msg !== "object") {
      return { valid: false, error: `Message at index ${i} is not a valid object.` };
    }

    if (!validRoles.includes(msg.role)) {
      return {
        valid: false,
        error: `Message at index ${i} has an invalid role '${msg.role}'. Must be one of: ${validRoles.join(", ")}.`,
      };
    }

    if (msg.role !== "assistant" && (typeof msg.content !== "string" || msg.content.trim().length === 0)) {
      return { valid: false, error: `Message at index ${i} has empty content.` };
    }
  }

  // Ensure the latest message is from the user
  const lastMessage = messages[messages.length - 1];
  if (lastMessage.role !== "user") {
    return { valid: false, error: "The last message in the sequence must have the role 'user'." };
  }

  return { valid: true };
}

export async function POST(request) {
  let body = null;
  const provider = getAIProvider();
  const model = getAIModel();

  try {
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Malformed request payload. Expected valid JSON body.",
          code: "INVALID_JSON",
        },
        { status: 400 }
      );
    }

    const { messages } = body;

    // 1. Validation
    const validation = validateMessages(messages);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: "VALIDATION_FAILED",
        },
        { status: 400 }
      );
    }

    // 2. Process message through unified agent core
    const result = await processAgentMessage({
      messages,
      channel: "website",
      context: { channel: "website" },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.warn("[SupportPilot Chat API Error]:", error.message || error);

    const status = error.status || 500;
    let message = error.message || "An unexpected internal server error occurred.";
    let code = "INTERNAL_SERVER_ERROR";

    if (status === 401) {
      code = "INVALID_API_KEY";
      message = `Authentication failed. The configured ${provider === "openrouter" ? "OPENROUTER_API_KEY" : "OPENAI_API_KEY"} is invalid or expired.`;
    } else if (status === 429) {
      code = "RATE_LIMIT_EXCEEDED";
      message = `${provider === "openrouter" ? "OpenRouter" : "OpenAI"} rate limit or credit quota exceeded. Please check your account balance or try again shortly.`;
    } else if (status === 404) {
      code = "MODEL_NOT_FOUND";
      message = `Configured model '${model}' was not found or is unavailable for this API key.`;
    }

    return NextResponse.json(
      {
        error: message,
        code: code,
      },
      { status: status >= 400 && status <= 599 ? status : 500 }
    );
  }
}
