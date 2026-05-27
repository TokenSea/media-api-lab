export function getApiKey(req) {
  const headerKey = req.headers.get("x-api-key")?.trim();
  if (headerKey) return headerKey;

  const authorization = req.headers.get("authorization")?.trim();
  if (authorization?.toLowerCase().startsWith("bearer ")) {
    return authorization.slice(7).trim();
  }

  return "";
}

export function getSeedanceApiUrl(req) {
  return req.headers.get("x-api-url")?.trim() || "";
}

export function getApiUrl(req) {
  return req.headers.get("x-api-url")?.trim() || "";
}

export function requireApiKey(req) {
  const apiKey = getApiKey(req);

  if (!apiKey) {
    const error = new Error("API key is required.");
    error.status = 400;
    throw error;
  }

  return apiKey;
}

export function requireSeedanceApiUrl(req) {
  return requireApiUrl(req, "Seedance API URL");
}

export function requireApiUrl(req, label = "API URL") {
  const apiUrl = getApiUrl(req);

  if (!apiUrl) {
    const error = new Error(`${label} is required.`);
    error.status = 400;
    throw error;
  }

  try {
    const url = new URL(apiUrl);
    return url.toString().replace(/\/$/, "");
  } catch {
    const error = new Error(`${label} is invalid.`);
    error.status = 400;
    throw error;
  }
}
