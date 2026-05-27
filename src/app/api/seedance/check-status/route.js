import { NextResponse } from "next/server";
import { requireApiKey, requireSeedanceApiUrl } from "@/lib/byok";
import { AIService } from "@/lib/services/ai";

export async function POST(req) {
  try {
    const apiKey = requireApiKey(req);
    const apiUrl = requireSeedanceApiUrl(req);
    const authMode = req.headers.get("x-auth-mode") || "bearer";
    const { requestId } = await req.json();

    if (!requestId) {
      return NextResponse.json({ error: "Request ID is required" }, { status: 400 });
    }

    const result = await AIService.checkStatus({
      apiKey,
      apiUrl,
      authMode,
      requestId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[AI_SEEDANCE_STATUS]", error);
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
