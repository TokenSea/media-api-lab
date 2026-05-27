import { prisma } from "@/lib/prisma";
import {
  extractFailureReason,
  extractRequestId,
  extractStatus,
  extractVideoUrl,
  isCompleted,
  isFailed,
  parseJson,
} from "./ai-utils";

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

function statusUrl(apiUrl, requestId) {
  return `${apiUrl.replace(/\/$/, "")}/${encodeURIComponent(requestId)}`;
}

export const AIService = {
  async submit({ apiKey, apiUrl, authMode = "bearer", payload, metadata }) {
    const submitRes = await fetch(apiUrl, {
      method: "POST",
      headers: providerHeaders(apiKey, authMode),
      body: JSON.stringify(payload),
    });

    const responseText = await submitRes.text();
    const data = parseJson(responseText);

    if (!submitRes.ok) {
      throw new Error(`API submission failed: ${submitRes.status} ${responseText}`);
    }

    const requestId = extractRequestId(data);
    const status = extractStatus(data);
    const imageUrl = extractVideoUrl(data);
    const finalStatus = imageUrl || isCompleted(status) ? "completed" : "processing";

    if (!requestId && !imageUrl) {
      throw new Error("No task id or output URL received from API");
    }

    await saveCreation(requestId, {
      prompt: metadata?.prompt || payload?.prompt || JSON.stringify(payload),
      aspectRatio: metadata?.ratio,
      resolution: metadata?.resolution,
      duration: metadata?.duration ? parseInt(metadata.duration, 10) : undefined,
      model: metadata?.model,
      inputImages: metadata?.images || [],
      videoFiles: metadata?.videos || [],
      audioFiles: metadata?.audios || [],
      status: finalStatus,
      imageUrl,
    });

    return {
      request_id: requestId,
      status: finalStatus,
      imageUrl,
      providerResponse: data,
    };
  },

  async checkStatus({ apiKey, apiUrl, authMode = "bearer", requestId }) {
    const creation = await findCreation(requestId);

    if (creation?.status === "completed") {
      return { status: "completed", imageUrl: creation.imageUrl };
    }

    const res = await fetch(statusUrl(apiUrl, requestId), {
      method: "GET",
      headers: providerHeaders(apiKey, authMode),
    });

    const responseText = await res.text();
    const data = parseJson(responseText);

    if (!res.ok) {
      throw new Error(`Status check failed: ${res.status} ${responseText}`);
    }

    const status = extractStatus(data);
    const imageUrl = extractVideoUrl(data);

    if (imageUrl || isCompleted(status)) {
      await updateCreation(creation, { status: "completed", imageUrl });
      return { status: "completed", imageUrl, providerResponse: data };
    }

    if (isFailed(status)) {
      const error = extractFailureReason(data);
      await updateCreation(creation, { status: "failed", error: String(error) });
      return { status: "failed", error: String(error), providerResponse: data };
    }

    return { status: "processing", providerResponse: data };
  },
};

async function saveCreation(requestId, data) {
  if (!requestId) return;
  const creationModel = prisma.creation || prisma.Creation;
  if (!creationModel) return;

  try {
    await creationModel.create({
      data: {
        ...data,
        requestId,
      },
    });
  } catch (error) {
    console.warn("[AI_SEEDANCE_DB_SAVE]", error.message);
  }
}

async function findCreation(requestId) {
  const creationModel = prisma.creation || prisma.Creation;
  if (!creationModel) return null;

  try {
    return await creationModel.findUnique({ where: { requestId } });
  } catch (error) {
    console.warn("[AI_SEEDANCE_DB_FIND]", error.message);
    return null;
  }
}

async function updateCreation(creation, data) {
  if (!creation) return;
  const creationModel = prisma.creation || prisma.Creation;
  if (!creationModel) return;

  try {
    await creationModel.update({
      where: { id: creation.id },
      data,
    });
  } catch (error) {
    console.warn("[AI_SEEDANCE_DB_UPDATE]", error.message);
  }
}
