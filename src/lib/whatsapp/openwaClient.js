/**
 * OpenWA Easy API HTTP Client.
 * Connects securely to a standalone @open-wa/wa-automate Easy API server.
 * Reads OPENWA_BASE_URL and OPENWA_API_KEY exclusively from server-side environment variables.
 * Never exposes credentials to client-side bundles or logs.
 */

/**
 * Masks an API key for safe server-side diagnostic logging.
 * Returns e.g. "wa-sec...4f89" without leaking secret credentials.
 */
function maskApiKey(key) {
  if (!key || typeof key !== "string") return "[not set]";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

/**
 * Returns configuration for OpenWA server.
 */
export function getOpenWAConfig() {
  const rawBaseUrl = process.env.OPENWA_BASE_URL || "http://localhost:8080";
  // Remove trailing slashes
  const baseUrl = rawBaseUrl.replace(/\/+$/, "");
  const apiKey = (process.env.OPENWA_API_KEY || "").trim();

  const isConfigured = Boolean(
    apiKey &&
    apiKey !== "your_openwa_api_key_here" &&
    baseUrl
  );

  return {
    baseUrl,
    apiKey,
    isConfigured,
  };
}

/**
 * Internal authenticated fetcher for OpenWA Easy API.
 * Uses strict timeouts and handles endpoint fallbacks.
 */
async function openwaFetch(path, options = {}) {
  const { baseUrl, apiKey, isConfigured } = getOpenWAConfig();

  if (!isConfigured) {
    return {
      success: false,
      error: "OPENWA_NOT_CONFIGURED",
      message: "OPENWA_API_KEY or OPENWA_BASE_URL is not configured in server environment variables.",
    };
  }

  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;
  const timeoutMs = options.timeoutMs || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    // OpenWA Easy API uses 'api_key' header for authentication
    api_key: apiKey,
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { rawResponse: text };
    }

    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        error: `OPENWA_HTTP_${response.status}`,
        message: data?.error || data?.message || `OpenWA server returned HTTP status ${response.status}.`,
        data,
      };
    }

    return {
      success: true,
      status: response.status,
      data,
    };
  } catch (error) {
    clearTimeout(timeoutId);

    if (error.name === "AbortError") {
      console.warn(`[OpenWA Client]: Request to ${path} timed out after ${timeoutMs}ms.`);
      return {
        success: false,
        error: "OPENWA_TIMEOUT",
        message: `OpenWA request timed out after ${timeoutMs}ms.`,
      };
    }

    console.warn(`[OpenWA Client]: Connection error to ${baseUrl}:`, error.message);
    return {
      success: false,
      error: "OPENWA_CONNECTION_FAILED",
      message: `Failed to connect to OpenWA server at ${baseUrl}: ${error.message}`,
    };
  }
}

/**
 * Checks connection health of the OpenWA Easy API instance.
 * Probes /checkConnection or /getHostDevice or /getMe.
 */
export async function checkOpenWAHealth() {
  const { baseUrl, apiKey, isConfigured } = getOpenWAConfig();

  if (!isConfigured) {
    return {
      connected: false,
      configured: false,
      baseUrl,
      maskedApiKey: maskApiKey(apiKey),
      message: "OpenWA Easy API is not configured. Set OPENWA_BASE_URL and OPENWA_API_KEY in .env.local.",
    };
  }

  // Attempt checkConnection
  const checkResult = await openwaFetch("/checkConnection", { timeoutMs: 4000 });
  if (checkResult.success) {
    return {
      connected: true,
      configured: true,
      baseUrl,
      maskedApiKey: maskApiKey(apiKey),
      details: checkResult.data,
      message: "Connected to OpenWA Easy API.",
    };
  }

  // Fallback to /getHostDevice or /getMe
  const hostResult = await openwaFetch("/getHostDevice", { timeoutMs: 4000 });
  if (hostResult.success) {
    return {
      connected: true,
      configured: true,
      baseUrl,
      maskedApiKey: maskApiKey(apiKey),
      details: hostResult.data,
      message: "Connected to OpenWA Easy API.",
    };
  }

  return {
    connected: false,
    configured: true,
    baseUrl,
    maskedApiKey: maskApiKey(apiKey),
    error: checkResult.error,
    message: checkResult.message,
  };
}

/**
 * Sends a text message to a WhatsApp user or chat.
 * Endpoint: POST /sendText
 * Payload: { to: "1234567890@c.us", content: "..." }
 */
export async function sendWhatsAppText(to, content) {
  if (!to || typeof to !== "string") {
    return {
      success: false,
      error: "INVALID_RECIPIENT",
      message: "Recipient 'to' must be a valid WhatsApp ID (e.g. '1234567890@c.us').",
    };
  }

  if (!content || typeof content !== "string") {
    return {
      success: false,
      error: "EMPTY_CONTENT",
      message: "Message content cannot be empty.",
    };
  }

  // Clean formatted recipient
  const target = to.includes("@") ? to : `${to}@c.us`;

  console.log(`[OpenWA Client]: Sending message to ${target.slice(0, 5)}*** (${content.length} chars)`);

  // OpenWA Easy API primary format
  const result = await openwaFetch("/sendText", {
    method: "POST",
    body: {
      to: target,
      content: content,
    },
    timeoutMs: 10000,
  });

  if (result.success) {
    return {
      success: true,
      messageId: result.data?.id || result.data?.messageId || `wa_${Date.now()}`,
      data: result.data,
    };
  }

  // Alternate fallback endpoint for different OpenWA wrapper modes
  if (result.status === 404) {
    console.log("[OpenWA Client]: /sendText returned 404, attempting fallback to /api/sendText");
    const fallbackResult = await openwaFetch("/api/sendText", {
      method: "POST",
      body: {
        to: target,
        content: content,
      },
      timeoutMs: 10000,
    });

    if (fallbackResult.success) {
      return {
        success: true,
        messageId: fallbackResult.data?.id || fallbackResult.data?.messageId || `wa_${Date.now()}`,
        data: fallbackResult.data,
      };
    }
  }

  return result;
}

/**
 * Simulates typing indicator on WhatsApp.
 * Endpoint: POST /simulateTyping
 */
export async function simulateWhatsAppTyping(to, on = true) {
  if (!to) return;
  const target = to.includes("@") ? to : `${to}@c.us`;
  try {
    await openwaFetch("/simulateTyping", {
      method: "POST",
      body: { to: target, on: Boolean(on) },
      timeoutMs: 2000,
    });
  } catch {
    // Non-critical, ignore typing errors
  }
}
