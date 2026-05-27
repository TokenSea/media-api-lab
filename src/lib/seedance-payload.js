export const SEEDANCE_FORMATS = {
  official: "official",
  raw: "raw",
};

export function parseJsonField(value, fallback) {
  if (!value.trim()) return fallback;
  return JSON.parse(value);
}

export function mediaUrl(item) {
  return typeof item === "string" ? item : item?.url;
}

export function buildSeedancePayload({
  format,
  rawJson,
  extraJson,
  model,
  prompt,
  ratio,
  resolution,
  duration,
  seed,
  watermark,
  cameraFixed,
  generateAudio,
  returnLastFrame,
  serviceTier,
  callbackUrl,
  images,
  videos,
  audios,
}) {
  if (format === SEEDANCE_FORMATS.raw) {
    return parseJsonField(rawJson, {});
  }

  const payload = {
    model: model.trim(),
    content: buildOfficialContent({ prompt, images, videos, audios }),
    ratio,
    resolution,
    duration: Number(duration),
    seed: seed.trim() ? Number(seed) : undefined,
    watermark,
    camera_fixed: cameraFixed,
    generate_audio: generateAudio,
    return_last_frame: returnLastFrame,
    service_tier: serviceTier.trim() || undefined,
    callback_url: callbackUrl.trim() || undefined,
  };

  return mergeExtra(cleanObject(payload), extraJson);
}

export function buildOfficialContent({ prompt, images, videos, audios }) {
  const content = [];

  if (prompt.trim()) {
    content.push({ type: "text", text: prompt.trim() });
  }

  images.forEach((item) => {
    const url = mediaUrl(item);
    if (!url) return;
    content.push(
      cleanObject({
        type: "image_url",
        image_url: { url },
        role: mediaRole(item),
      }),
    );
  });

  videos.forEach((item) => {
    const url = mediaUrl(item);
    if (!url) return;
    content.push(
      cleanObject({
        type: "video_url",
        video_url: { url },
        role: mediaRole(item),
      }),
    );
  });

  audios.forEach((item) => {
    const url = mediaUrl(item);
    if (!url) return;
    content.push(
      cleanObject({
        type: "audio_url",
        audio_url: { url },
        role: mediaRole(item),
      }),
    );
  });

  return content;
}

function mediaRole(item) {
  return typeof item === "string" ? undefined : item?.role || undefined;
}

function mergeExtra(payload, extraJson) {
  const extra = parseJsonField(extraJson, {});
  if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
    throw new Error("Extra JSON must be an object.");
  }
  return { ...payload, ...extra };
}

function cleanObject(object) {
  return Object.fromEntries(
    Object.entries(object).filter(([, value]) => value !== undefined && value !== ""),
  );
}
