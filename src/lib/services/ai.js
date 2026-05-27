import { prisma } from "@/lib/prisma";

function parseJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

function extractRequestId(data) {
  return (
    data?.id ||
    data?.request_id ||
    data?.task_id ||
    data?.generation_id ||
    data?.data?.id ||
    data?.data?.request_id ||
    data?.data?.task_id ||
    data?.data?.generation_id
  );
}

function extractStatus(data) {
  const status =
    data?.status ||
    data?.state ||
    data?.data?.status ||
    data?.data?.state ||
    data?.task?.status ||
    data?.data?.task?.status;

  return typeof status === "string" ? status.toLowerCase() : undefined;
}

function extractVideoUrl(data) {
  const candidates = [
    data?.video_url,
    data?.url,
    data?.output_url,
    data?.data?.video_url,
    data?.data?.url,
    data?.data?.output_url,
    data?.result?.video_url,
    data?.result?.url,
    data?.data?.result?.video_url,
    data?.data?.result?.url,
    Array.isArray(data?.outputs) ? data.outputs[0] : undefined,
    Array.isArray(data?.output) ? data.output[0] : undefined,
    Array.isArray(data?.data?.outputs) ? data.data.outputs[0] : undefined,
    Array.isArray(data?.data?.output) ? data.data.output[0] : undefined,
    data?.data?.content?.video_url,
    data?.content?.video_url,
  ];

  return candidates.find((candidate) => typeof candidate === "string" && candidate);
}

function isCompleted(status) {
  return ["completed", "complete", "succeeded", "success", "done"].includes(status);
}

function isFailed(status) {
  return ["failed", "failure", "error", "cancelled", "canceled"].includes(status);
}

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

    if (creation?.status === "failed") {
      throw new Error(creation.error || "Generation failed.");
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
      const error = data?.error?.message || data?.error || data?.message || "Generation failed.";
      await updateCreation(creation, { status: "failed", error: String(error) });
      throw new Error(String(error));
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
