export function parseJson(text) {
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export function extractRequestId(data) {
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

export function extractStatus(data) {
  const status =
    data?.status ||
    data?.state ||
    data?.data?.status ||
    data?.data?.state ||
    data?.data?.data?.status ||
    data?.data?.data?.state ||
    data?.task?.status ||
    data?.data?.task?.status;

  return typeof status === "string" ? status.toLowerCase() : undefined;
}

export function extractVideoUrl(data) {
  const candidates = [
    data?.video_url,
    data?.url,
    data?.output_url,
    data?.result_url,
    data?.data?.video_url,
    data?.data?.url,
    data?.data?.output_url,
    data?.data?.result_url,
    data?.data?.data?.video_url,
    data?.data?.data?.url,
    data?.data?.data?.output_url,
    data?.data?.data?.result_url,
    data?.result?.video_url,
    data?.result?.url,
    data?.result?.result_url,
    data?.data?.result?.video_url,
    data?.data?.result?.url,
    data?.data?.result?.result_url,
    Array.isArray(data?.outputs) ? data.outputs[0] : undefined,
    Array.isArray(data?.output) ? data.output[0] : undefined,
    Array.isArray(data?.data?.outputs) ? data.data.outputs[0] : undefined,
    Array.isArray(data?.data?.output) ? data.data.output[0] : undefined,
    Array.isArray(data?.data?.data?.outputs) ? data.data.data.outputs[0] : undefined,
    Array.isArray(data?.data?.data?.output) ? data.data.data.output[0] : undefined,
    data?.data?.content?.video_url,
    data?.data?.content?.video_url?.url,
    data?.data?.data?.content?.video_url,
    data?.data?.data?.content?.video_url?.url,
    data?.content?.video_url,
    data?.content?.video_url?.url,
    extractContentVideoUrl(data?.content),
    extractContentVideoUrl(data?.data?.content),
    extractContentVideoUrl(data?.data?.data?.content),
  ];

  return candidates.find((candidate) => typeof candidate === "string" && candidate);
}

export function extractFailureReason(data) {
  const candidates = [
    data?.fail_reason,
    data?.failure_reason,
    data?.error?.message,
    data?.error,
    data?.message,
    data?.data?.fail_reason,
    data?.data?.failure_reason,
    data?.data?.error?.message,
    data?.data?.error,
    data?.data?.message,
    data?.data?.data?.fail_reason,
    data?.data?.data?.failure_reason,
    data?.data?.data?.error?.message,
    data?.data?.data?.error,
    data?.data?.data?.message,
  ];

  return (
    candidates.find((candidate) => typeof candidate === "string" && candidate.trim()) ||
    "Generation failed."
  );
}

export function isCompleted(status) {
  return ["completed", "complete", "succeeded", "success", "done"].includes(status);
}

export function isFailed(status) {
  return ["failed", "failure", "error", "cancelled", "canceled", "expired"].includes(status);
}

function extractContentVideoUrl(content) {
  if (!Array.isArray(content)) return undefined;

  const item = content.find((entry) => entry?.video_url?.url || typeof entry?.video_url === "string");
  if (!item) return undefined;

  return typeof item.video_url === "string" ? item.video_url : item.video_url.url;
}
