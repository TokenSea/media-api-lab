import { NextResponse } from "next/server";
import { requireApiKey, requireApiUrl } from "@/lib/byok";
import { extractImage } from "@/lib/image-response";

function providerHeaders(apiKey, authMode) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (authMode === "api-key" || authMode === "both") {
    headers["x-api-key"] = apiKey;
  }

  if (authMode === "bearer" || authMode === "both") {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  return headers;
}

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function POST(req) {
  try {
    const apiKey = requireApiKey(req);
    const apiUrl = requireApiUrl(req, "Image API URL");
    const authMode = req.headers.get("x-auth-mode") || "bearer";
    const { payload } = await req.json();

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Payload object is required" }, { status: 400 });
    }

    const upstreamRes = await fetch(apiUrl, {
      method: "POST",
      headers: providerHeaders(apiKey, authMode),
      body: JSON.stringify(payload),
    });

    const responseText = await upstreamRes.text();
    const providerResponse = parseJson(responseText);

    if (!upstreamRes.ok) {
      return NextResponse.json(
        { error: `API submission failed: ${upstreamRes.status} ${responseText}` },
        { status: upstreamRes.status },
      );
    }

    const image = extractImage(providerResponse);

    return NextResponse.json({
      status: "completed",
      image,
      providerResponse,
    });
  } catch (error) {
    console.error("[IMAGE_GENERATION]", error);
    return NextResponse.json(
      { error: error.message || "Internal Error" },
      { status: error.status || 500 },
    );
  }
}
