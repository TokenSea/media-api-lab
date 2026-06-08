import assert from "node:assert/strict";
import test from "node:test";
import { buildImagePayload, IMAGE_FORMATS } from "../src/lib/image-payload.js";
import {
  CHANNEL_PRESETS,
  GEMINI_CASE_PRESETS,
  TOKENSEA_GEMINI_API_URL,
  TOKENSEA_OPENAI_IMAGES_API_URL,
  rawJsonForCase,
} from "../src/lib/image-presets.js";
import { extractImage } from "../src/lib/image-response.js";

test("builds Gemini generateContent payload with image response modality", () => {
  const payload = buildImagePayload({
    format: IMAGE_FORMATS.gemini,
    prompt: "A clean product photo of a nano banana.",
  });

  assert.deepEqual(payload, {
    contents: [
      {
        role: "user",
        parts: [{ text: "A clean product photo of a nano banana." }],
      },
    ],
    generationConfig: {
      responseModalities: ["TEXT", "IMAGE"],
    },
  });
});

test("builds OpenAI image payload without response_format by default", () => {
  const payload = buildImagePayload({
    format: IMAGE_FORMATS.openai,
    model: "gpt-image-2",
    prompt: "生成图片",
    n: "1",
    size: "1024x1024",
    outputFormat: "png",
    user: "",
  });

  assert.equal(payload.model, "gpt-image-2");
  assert.equal(payload.prompt, "生成图片");
  assert.equal(payload.response_format, undefined);
});

test("extracts Gemini inlineData image artifacts", () => {
  const image = extractImage({
    candidates: [
      {
        content: {
          parts: [
            { text: "Here is the image." },
            { inlineData: { mimeType: "image/jpeg", data: "abc123" } },
          ],
        },
      },
    ],
  });

  assert.deepEqual(image, {
    b64: "abc123",
    mimeType: "image/jpeg",
    url: undefined,
  });
});

test("defaults Tokensea channel to OpenAI Images-compatible route", () => {
  assert.equal(
    TOKENSEA_OPENAI_IMAGES_API_URL,
    "https://agent.tokensea.ai/v1/images/generations",
  );
  assert.equal(CHANNEL_PRESETS[0].value, "tokensea-openai");
  assert.equal(CHANNEL_PRESETS[0].format, IMAGE_FORMATS.openai);
});

test("keeps Tokensea Gemini preset available for generateContent", () => {
  assert.equal(
    TOKENSEA_GEMINI_API_URL,
    "https://agent.tokensea.ai/v1/models/gemini-3.1-flash-image:generateContent",
  );
});

test("Gemini case presets stay within Lovart-supported image inputs", () => {
  const caseValues = GEMINI_CASE_PRESETS.map((item) => item.value);

  assert.deepEqual(caseValues, [
    "none",
    "text-to-image",
    "aspect-resolution-config",
    "image-edit",
    "multi-image-reference",
    "file-data-reference",
  ]);

  for (const casePreset of GEMINI_CASE_PRESETS) {
    const rawJson = rawJsonForCase(casePreset);
    assert.equal(rawJson.includes("google_search"), false);
    assert.equal(rawJson.includes('"tools"'), false);
  }
});
