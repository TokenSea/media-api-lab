import { IMAGE_FORMATS } from "./image-payload.js";

export const DEFAULT_IMAGE_API_URL = "https://api.openai.com/v1/images/generations";
export const DEFAULT_IMAGE_MODEL = "gpt-image-2";
export const TOKENSEA_OPENAI_IMAGES_API_URL =
  "https://agent.tokensea.ai/v1/images/generations";
export const TOKENSEA_OPENAI_IMAGES_MODEL = "gpt-image-2";
export const TOKENSEA_GEMINI_API_URL =
  "https://agent.tokensea.ai/v1/models/gemini-3.1-flash-image:generateContent";
export const TOKENSEA_GEMINI_MODEL = "gemini-3.1-flash-image";

export const CHANNEL_PRESETS = [
  {
    value: "tokensea-openai",
    label: "Tokensea Images",
    apiUrl: TOKENSEA_OPENAI_IMAGES_API_URL,
    authMode: "bearer",
    format: IMAGE_FORMATS.openai,
    model: TOKENSEA_OPENAI_IMAGES_MODEL,
    outputFormat: "png",
  },
  {
    value: "tokensea-gemini",
    label: "Tokensea Gemini",
    apiUrl: TOKENSEA_GEMINI_API_URL,
    authMode: "bearer",
    format: IMAGE_FORMATS.gemini,
    model: TOKENSEA_GEMINI_MODEL,
    outputFormat: "jpeg",
  },
  {
    value: "openai",
    label: "OpenAI Images",
    apiUrl: DEFAULT_IMAGE_API_URL,
    authMode: "bearer",
    format: IMAGE_FORMATS.openai,
    model: DEFAULT_IMAGE_MODEL,
    outputFormat: "png",
  },
  {
    value: "custom",
    label: "Custom",
  },
];

export const GEMINI_CASE_PRESETS = [
  {
    value: "none",
    label: "Manual",
  },
  {
    value: "text-to-image",
    label: "Text to image",
    prompt: "Create a clean studio product photo of a single nano banana on a white plate.",
    format: IMAGE_FORMATS.gemini,
  },
  {
    value: "aspect-resolution-config",
    label: "Aspect + size",
    rawJson: {
      contents: [
        {
          parts: [
            {
              text: "Create a clean product hero image of a single nano banana on a white plate. Keep the composition suitable for a website banner.",
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "2K",
        },
      },
    },
  },
  {
    value: "image-edit",
    label: "Image edit",
    rawJson: {
      contents: [
        {
          parts: [
            {
              text: "Edit this image to place the subject on a clean white studio background.",
            },
            {
              inline_data: {
                mime_type: "image/png",
                data: "REPLACE_WITH_BASE64_IMAGE",
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    },
  },
  {
    value: "multi-image-reference",
    label: "Multi-image refs",
    rawJson: {
      contents: [
        {
          parts: [
            {
              text: "Create an office group photo using these reference people. Keep faces distinct and natural.",
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: "REPLACE_WITH_BASE64_IMAGE_1",
              },
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: "REPLACE_WITH_BASE64_IMAGE_2",
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    },
  },
  {
    value: "file-data-reference",
    label: "FileData ref",
    rawJson: {
      contents: [
        {
          parts: [
            {
              text: "Use this hosted reference image as input context and create a polished product image.",
            },
            {
              file_data: {
                mime_type: "image/png",
                file_uri: "https://example.com/reference.png",
              },
            },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    },
  },
];

export function rawJsonForCase(casePreset) {
  if (!casePreset?.rawJson) return "";
  return JSON.stringify(casePreset.rawJson, null, 2);
}
