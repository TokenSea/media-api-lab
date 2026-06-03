export const IMAGE_FORMATS = {
  openai: "openai",
  gemini: "gemini",
  raw: "raw",
};

export function parseJsonField(value, fallback) {
  if (!value.trim()) return fallback;
  return JSON.parse(value);
}

function cleanObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== "" && item !== undefined && item !== null),
  );
}

export function buildImagePayload({
  background,
  extraJson = "",
  format,
  moderation,
  model = "",
  n,
  outputCompression,
  outputFormat,
  partialImages,
  prompt = "",
  quality,
  rawJson = "",
  size,
  stream,
  user,
}) {
  if (format === IMAGE_FORMATS.raw) return parseJsonField(rawJson, {});

  if (format === IMAGE_FORMATS.gemini) {
    return {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt.trim() }],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
      ...parseJsonField(extraJson, {}),
    };
  }

  const base = cleanObject({
    model: model.trim(),
    prompt: prompt.trim(),
    size,
    quality,
    output_format: outputFormat,
    background,
    moderation,
    n: Number(n),
    output_compression: outputCompression ? Number(outputCompression) : undefined,
    stream,
    partial_images: partialImages ? Number(partialImages) : undefined,
    user: user.trim() || undefined,
  });

  return {
    ...base,
    ...parseJsonField(extraJson, {}),
  };
}
