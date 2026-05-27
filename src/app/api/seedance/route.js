import { NextResponse } from "next/server";
import { requireApiKey, requireSeedanceApiUrl } from "@/lib/byok";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const apiKey = requireApiKey(req);
    const apiUrl = requireSeedanceApiUrl(req);
    const body = await req.json();
    const authMode = req.headers.get("x-auth-mode") || "bearer";
    const { payload, metadata } = body;

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return NextResponse.json({ error: "Payload object is required" }, { status: 400 });
    }

    const result = await AIService.submit({
      apiKey,
      apiUrl,
      authMode,
      payload,
      metadata,
    });

    return NextResponse.json({ ...result, metadata });
  } catch (error) {
    console.error("[AI_SEEDANCE]", error);
    return NextResponse.json(
      { error: error.message || "Internal Error" },
      { status: error.status || 500 },
    );
  }
}
