import assert from "node:assert/strict";
import test from "node:test";
import {
  extractFailureReason,
  extractStatus,
  extractVideoUrl,
  isFailed,
} from "../src/lib/services/ai-utils.js";
import {
  SEEDANCE_FORMATS,
  buildSeedancePayload,
} from "../src/lib/seedance-payload.js";

test("extracts nested failure reasons and result URLs", () => {
  const response = {
    data: {
      data: { status: "failed" },
      fail_reason: 'convert request failed: missing required parameter "prompt"',
      result_url: "https://example.com/out.mp4",
      status: "FAILURE",
    },
  };

  assert.equal(extractStatus(response), "failure");
  assert.equal(
    extractFailureReason(response),
    'convert request failed: missing required parameter "prompt"',
  );
  assert.equal(extractVideoUrl(response), "https://example.com/out.mp4");
});

test("extracts official content array video URLs and treats expired as failed", () => {
  const response = {
    status: "expired",
    content: [
      {
        type: "video_url",
        video_url: { url: "https://example.com/official.mp4" },
      },
    ],
  };

  assert.equal(extractVideoUrl(response), "https://example.com/official.mp4");
  assert.equal(isFailed(extractStatus(response)), true);
});

test("builds Volcengine official payload without compatibility field conversion", () => {
  const payload = buildSeedancePayload({
    format: SEEDANCE_FORMATS.official,
    rawJson: "",
    extraJson: "",
    model: "doubao-seedance-2-0-260128",
    prompt: "在操场散步， @参考图1 说着今天天气真好",
    ratio: "16:9",
    resolution: "720p",
    duration: "5",
    seed: "",
    watermark: false,
    cameraFixed: false,
    generateAudio: false,
    returnLastFrame: false,
    serviceTier: "",
    callbackUrl: "",
    images: [
      {
        url: "https://picx.zhimg.com/v2-2e260b64e37badca4bdd2ac36f8fb908.jpg?source=92e748ee",
        role: "",
      },
    ],
    videos: [],
    audios: [],
  });

  assert.deepEqual(payload, {
    model: "doubao-seedance-2-0-260128",
    content: [
      {
        type: "text",
        text: "在操场散步， @参考图1 说着今天天气真好",
      },
      {
        type: "image_url",
        image_url: {
          url: "https://picx.zhimg.com/v2-2e260b64e37badca4bdd2ac36f8fb908.jpg?source=92e748ee",
        },
      },
    ],
    ratio: "16:9",
    resolution: "720p",
    duration: 5,
    watermark: false,
    camera_fixed: false,
    generate_audio: false,
    return_last_frame: false,
  });
  assert.equal("seconds" in payload, false);
  assert.equal("prompt" in payload, false);
});

test("builds official media roles and allows media-only content", () => {
  const payload = buildSeedancePayload({
    format: SEEDANCE_FORMATS.official,
    rawJson: "",
    extraJson: '{"priority":5}',
    model: "doubao-seedance-2-0-260128",
    prompt: "",
    ratio: "adaptive",
    resolution: "720p",
    duration: "-1",
    seed: "11",
    watermark: true,
    cameraFixed: false,
    generateAudio: true,
    returnLastFrame: true,
    serviceTier: "",
    callbackUrl: "",
    images: [{ url: "https://example.com/ref.png", role: "reference_image" }],
    videos: [{ url: "https://example.com/ref.mp4", role: "reference_video" }],
    audios: [{ url: "https://example.com/ref.wav", role: "reference_audio" }],
  });

  assert.deepEqual(payload.content, [
    {
      type: "image_url",
      image_url: { url: "https://example.com/ref.png" },
      role: "reference_image",
    },
    {
      type: "video_url",
      video_url: { url: "https://example.com/ref.mp4" },
      role: "reference_video",
    },
    {
      type: "audio_url",
      audio_url: { url: "https://example.com/ref.wav" },
      role: "reference_audio",
    },
  ]);
  assert.equal(payload.duration, -1);
  assert.equal(payload.seed, 11);
  assert.equal(payload.priority, 5);
});
