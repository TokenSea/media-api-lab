function extractGeminiImage(data) {
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

  for (const candidate of candidates) {
    const parts = Array.isArray(candidate?.content?.parts) ? candidate.content.parts : [];

    for (const part of parts) {
      const inlineData = part?.inlineData || part?.inline_data;
      const b64 = inlineData?.data;

      if (b64) {
        return {
          b64,
          mimeType: inlineData?.mimeType || inlineData?.mime_type,
          url: undefined,
        };
      }
    }
  }

  return null;
}

export function extractImage(data) {
  const geminiImage = extractGeminiImage(data);
  if (geminiImage) return geminiImage;

  const first = Array.isArray(data?.data) ? data.data[0] : data?.data;
  const b64 = data?.b64_json || first?.b64_json || data?.image?.b64_json;
  const url = data?.url || first?.url || data?.image?.url;

  return { b64, url, mimeType: undefined };
}
