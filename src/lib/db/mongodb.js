import { MongoClient } from "mongodb";

/**
 * MongoDB Atlas Connection Utility for Next.js App Router.
 *
 * Implements a connection pattern that caches the MongoClient promise
 * across module reloads in development to prevent connection exhaustion.
 * Automatically clears stale connection pools if MONGODB_URI is modified.
 *
 * Credentials are strictly server-only and never exposed to the client.
 */

/**
 * Masks database credentials for safe server-side diagnostic logging.
 * Replaces password with '***' so connection strings are never leaked in logs.
 * Robust against special characters and multiple '@' signs.
 */
export function maskMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== "string") return "[not set]";
  const protocolMatch = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)/);
  if (!protocolMatch) return "[invalid URI format]";
  const protocol = protocolMatch[1];
  const withoutProtocol = rawUri.slice(protocol.length);
  const atIndex = withoutProtocol.lastIndexOf("@");
  if (atIndex === -1) return `${protocol}***`;
  const colonIndex = withoutProtocol.indexOf(":");
  if (colonIndex === -1 || colonIndex > atIndex) {
    return `${protocol}***@${withoutProtocol.slice(atIndex + 1)}`;
  }
  const username = withoutProtocol.slice(0, colonIndex);
  const host = withoutProtocol.slice(atIndex + 1);
  return `${protocol}${username}:***@${host}`;
}

/**
 * Verifies if a valid non-placeholder MONGODB_URI is present in the environment.
 */
export function isMongoDBConfigured() {
  const currentUri = process.env.MONGODB_URI;
  if (!currentUri) return false;
  if (
    currentUri.includes("username:password@cluster") ||
    currentUri.includes("your_mongodb_uri") ||
    currentUri.trim().length === 0
  ) {
    return false;
  }
  return true;
}

/**
 * Extracts the database name from the environment or URI path.
 */
export function getDatabaseName(uri) {
  if (process.env.MONGODB_DB_NAME && process.env.MONGODB_DB_NAME.trim().length > 0) {
    return process.env.MONGODB_DB_NAME.trim();
  }
  if (uri && typeof uri === "string") {
    try {
      const match = uri.match(/mongodb(?:\+srv)?:\/\/[^/]+\/([^?]+)/);
      if (match && match[1] && match[1].trim().length > 0) {
        return match[1].trim();
      }
    } catch {
      // Fallback below
    }
  }
  return "supportpilot";
}

/**
 * Sanitizes MongoDB connection URI by automatically URL-encoding special characters in password
 * (e.g. '@' -> '%40') if user entered an unencoded password.
 */
export function sanitizeMongoUri(rawUri) {
  if (!rawUri || typeof rawUri !== "string") return rawUri;
  const match = rawUri.match(/^(mongodb(?:\+srv)?:\/\/)([^:]+):(.+)@([^@]+)$/);
  if (match) {
    const [, protocol, username, rawPassword, hostAndParams] = match;
    if (rawPassword.includes("@")) {
      const encodedPassword = rawPassword.replace(/@/g, "%40");
      return `${protocol}${username}:${encodedPassword}@${hostAndParams}`;
    }
  }
  return rawUri;
}

const clientOptions = {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
};

/**
 * Closes existing MongoClient connections and resets the global cache.
 * Useful when environment variables change or for test teardown.
 */
export async function resetDatabaseConnection() {
  if (global._mongoClientInstance) {
    try {
      await global._mongoClientInstance.close();
    } catch {
      // Ignored on close
    }
  }
  global._mongoClientInstance = null;
  global._mongoClientPromise = null;
  global._mongoClientUri = null;
}

async function createConnectedClient(uri, dbName) {
  console.log(`[MongoDB Diagnostic]: Initiating connection to ${maskMongoUri(uri)} (DB: '${dbName}')`);

  const client = new MongoClient(uri, clientOptions);
  await client.connect();

  console.log(`[MongoDB Diagnostic]: Successfully authenticated and connected to MongoDB Atlas. Active database: '${dbName}'`);
  global._mongoClientInstance = client;
  return client;
}

/**
 * Returns a connected MongoDB database instance.
 * Automatically clears stale connection pools if MONGODB_URI is modified in development.
 * Throws a clean, safe error if MONGODB_URI is unconfigured or connection fails.
 */
export async function getDatabase() {
  if (!isMongoDBConfigured()) {
    const error = new Error(
      "MongoDB Atlas is not configured. Please define MONGODB_URI in your .env.local file."
    );
    error.code = "MONGODB_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }

  const rawUri = process.env.MONGODB_URI;
  const uri = sanitizeMongoUri(rawUri);
  const dbName = getDatabaseName(uri);

  // If MONGODB_URI changed in .env.local during runtime, clear stale client cache
  if (global._mongoClientUri && global._mongoClientUri !== uri) {
    console.log("[MongoDB Diagnostic]: Detected MONGODB_URI update. Resetting stale client cache.");
    await resetDatabaseConnection();
  }

  try {
    if (!global._mongoClientPromise) {
      global._mongoClientUri = uri;
      global._mongoClientPromise = createConnectedClient(uri, dbName).catch((err) => {
        // Clear cached promise on failure so next request can retry after credentials update
        global._mongoClientPromise = null;
        global._mongoClientUri = null;
        throw err;
      });
    }

    const connectedClient = await global._mongoClientPromise;
    return connectedClient.db(dbName);
  } catch (err) {
    console.error(`[MongoDB Diagnostic]: Connection error: ${err.message}`);
    const error = new Error(
      `Unable to establish connection to MongoDB Atlas (${err.message}). Please verify your database user credentials and IP access list.`
    );
    error.code = "MONGODB_CONNECTION_FAILED";
    error.status = 503;
    throw error;
  }
}

/**
 * Returns the active MongoClient instance.
 */
export async function getMongoClient() {
  if (!isMongoDBConfigured()) {
    const error = new Error("MongoDB Atlas is not configured.");
    error.code = "MONGODB_NOT_CONFIGURED";
    error.status = 503;
    throw error;
  }

  const rawUri = process.env.MONGODB_URI;
  const uri = sanitizeMongoUri(rawUri);
  const dbName = getDatabaseName(uri);

  if (global._mongoClientUri && global._mongoClientUri !== uri) {
    await resetDatabaseConnection();
  }

  try {
    if (!global._mongoClientPromise) {
      global._mongoClientUri = uri;
      global._mongoClientPromise = createConnectedClient(uri, dbName).catch((err) => {
        global._mongoClientPromise = null;
        global._mongoClientUri = null;
        throw err;
      });
    }

    return await global._mongoClientPromise;
  } catch (err) {
    console.error(`[MongoDB Diagnostic]: MongoClient connection error: ${err.message}`);
    throw err;
  }
}

/**
 * Health check & diagnostic function for MongoDB Atlas.
 * Runs ping command and inspects cluster state without leaking credentials.
 */
export async function checkDatabaseHealth() {
  if (!isMongoDBConfigured()) {
    return {
      connected: false,
      configured: false,
      code: "MONGODB_NOT_CONFIGURED",
      message: "MONGODB_URI is not configured in .env.local.",
    };
  }

  const rawUri = process.env.MONGODB_URI;
  const uri = sanitizeMongoUri(rawUri);
  const dbName = getDatabaseName(uri);
  const masked = maskMongoUri(uri);

  let username = null;
  let cluster = null;
  try {
    const protoMatch = uri.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (protoMatch) {
      const rest = uri.slice(protoMatch[1].length);
      const atIdx = rest.lastIndexOf("@");
      if (atIdx !== -1) {
        const colonIdx = rest.indexOf(":");
        if (colonIdx !== -1 && colonIdx < atIdx) {
          username = rest.slice(0, colonIdx);
        }
        const hostPart = rest.slice(atIdx + 1);
        cluster = hostPart.split("/")[0].split("?")[0];
      }
    }
  } catch {
    // Non-critical extraction
  }

  const startTime = Date.now();
  try {
    const client = await getMongoClient();
    const db = client.db(dbName);
    await db.command({ ping: 1 });
    const latencyMs = Date.now() - startTime;
    const collections = await db.listCollections().toArray();

    return {
      connected: true,
      configured: true,
      database: dbName,
      cluster,
      username,
      latencyMs,
      collections: collections.map((c) => c.name),
      maskedUri: masked,
      message: "Successfully connected to MongoDB Atlas.",
    };
  } catch (error) {
    return {
      connected: false,
      configured: true,
      database: dbName,
      cluster,
      username,
      maskedUri: masked,
      code: error.code || "CONNECTION_FAILED",
      error: error.message,
      diagnosticHint:
        error.message.includes("bad auth") || error.message.includes("Authentication failed")
          ? `Atlas authentication failed. Verify that database user '${username || "your_user"}' exists in Atlas Console -> Security -> Database Access and that the password matches.`
          : error.message.includes("SSL alert") || error.message.includes("tlsv1 alert")
          ? "Atlas network connection rejected. Verify that your current public IP is whitelisted in Atlas Console -> Security -> Network Access."
          : "Verify your network connection and MongoDB Atlas cluster status.",
    };
  }
}
