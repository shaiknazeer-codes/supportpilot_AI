import OpenAI from "openai";

/**
 * Masks an API key for safe server-side diagnostic logging.
 * Returns e.g. "sk-or-v1-ab...4f89" without leaking secret credentials.
 */
function maskApiKey(key) {
  if (!key || typeof key !== "string") return "[not set]";
  if (key.length <= 10) return "***";
  return `${key.slice(0, 8)}...${key.slice(-4)}`;
}

/**
 * Determines the active AI provider based on environment variables.
 * Priority: OpenRouter (if OPENROUTER_API_KEY is configured) -> OpenAI (if OPENAI_API_KEY is configured).
 */
export function getAIProvider() {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey && openRouterKey !== "your_openrouter_api_key_here" && openRouterKey.trim().length > 0) {
    return "openrouter";
  }

  const openAiKey = process.env.OPENAI_API_KEY;
  if (openAiKey && openAiKey !== "your_openai_api_key_here" && openAiKey.trim().length > 0) {
    return "openai";
  }

  return null;
}

/**
 * Initializes and returns an OpenAI SDK client configured for either OpenRouter or OpenAI.
 * Never exposes credentials to client-side bundles.
 */
export function getAIClient() {
  const provider = getAIProvider();

  if (provider === "openrouter") {
    const apiKey = process.env.OPENROUTER_API_KEY.trim();
    console.log(
      `[AI Provider Diagnostic]: Using OpenRouter | Endpoint: https://openrouter.ai/api/v1 | Key: ${maskApiKey(apiKey)}`
    );

    return new OpenAI({
      apiKey: apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "SupportPilot AI Customer Operations",
      },
    });
  }

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY.trim();
    console.log(
      `[AI Provider Diagnostic]: Using OpenAI | Endpoint: https://api.openai.com/v1 | Key: ${maskApiKey(apiKey)}`
    );

    return new OpenAI({
      apiKey: apiKey,
    });
  }

  console.warn("[AI Provider Diagnostic]: No valid OPENROUTER_API_KEY or OPENAI_API_KEY configured.");
  return null;
}

/**
 * Retrieves the configured model name according to the active provider.
 */
export function getAIModel() {
  const provider = getAIProvider();

  if (provider === "openrouter") {
    // Default to a recognized free model on OpenRouter if not explicitly configured
    return process.env.OPENROUTER_MODEL || "meta-llama/llama-3.3-70b-instruct:free";
  }

  if (provider === "openai") {
    return process.env.OPENAI_MODEL || "gpt-4o-mini";
  }

  return "unconfigured";
}

// Backwards-compatible aliases
export const getOpenAIClient = getAIClient;
export const getOpenAIModel = getAIModel;
