"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { FaChevronDown, FaCode, FaImage, FaKey, FaLink } from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { buildImagePayload, IMAGE_FORMATS } from "@/lib/image-payload";
import {
  CHANNEL_PRESETS,
  DEFAULT_IMAGE_API_URL,
  GEMINI_CASE_PRESETS,
  rawJsonForCase,
} from "@/lib/image-presets";

const AUTH_OPTIONS = [
  { value: "bearer", label: "Bearer" },
  { value: "api-key", label: "x-api-key" },
  { value: "both", label: "Both" },
];

const FORMAT_OPTIONS = [
  { value: IMAGE_FORMATS.openai, label: "OpenAI Images" },
  { value: IMAGE_FORMATS.gemini, label: "Gemini generateContent" },
  { value: IMAGE_FORMATS.raw, label: "Raw JSON" },
];

const SIZE_OPTIONS = ["1024x1024", "1536x1024", "1024x1536", "auto"].map((value) => ({
  value,
  label: value,
}));

const QUALITY_OPTIONS = ["auto", "low", "medium", "high"].map((value) => ({
  value,
  label: value,
}));

const OUTPUT_FORMAT_OPTIONS = ["png", "jpeg", "webp"].map((value) => ({
  value,
  label: value.toUpperCase(),
}));

const BACKGROUND_OPTIONS = ["auto", "transparent", "opaque"].map((value) => ({
  value,
  label: value,
}));

const MODERATION_OPTIONS = ["auto", "low"].map((value) => ({
  value,
  label: value,
}));

function CustomSelect({ label, value, options, onChange, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) || options[0];

  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
        {label}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-glass-bg border border-glass-border rounded-md text-xs font-medium text-foreground hover:bg-glass-hover transition-colors outline-none"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon className="text-primary-500 text-[10px]" />}
            {selectedOption.label}
          </div>
          <FaChevronDown
            className={`text-[10px] text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
        {isOpen && (
          <div className="absolute top-10 left-0 right-0 bg-glass-bg border border-glass-border rounded-md shadow-xl z-[100] overflow-hidden backdrop-blur-xl">
            {options.map((option) => (
              <button
                type="button"
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${
                  value === option.value
                    ? "bg-primary-500 text-white"
                    : "text-muted hover:bg-glass-hover hover:text-foreground"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function imageDataUri(image, outputFormat) {
  if (image?.url) return image.url;
  if (!image?.b64) return null;
  return `data:${image.mimeType || `image/${outputFormat}`};base64,${image.b64}`;
}

function imageExtension(image, outputFormat) {
  return image?.mimeType?.split("/")?.[1] || outputFormat;
}

export default function ImagesPage() {
  const [channelPreset, setChannelPreset] = useState(CHANNEL_PRESETS[0].value);
  const [geminiCase, setGeminiCase] = useState(GEMINI_CASE_PRESETS[0].value);
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authMode, setAuthMode] = useState(AUTH_OPTIONS[0].value);
  const [format, setFormat] = useState(CHANNEL_PRESETS[0].format);

  const [model, setModel] = useState(CHANNEL_PRESETS[0].model);
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState("1024x1024");
  const [quality, setQuality] = useState("auto");
  const [outputFormat, setOutputFormat] = useState("png");
  const [background, setBackground] = useState("auto");
  const [moderation, setModeration] = useState("auto");
  const [n, setN] = useState("1");
  const [outputCompression, setOutputCompression] = useState("");
  const [stream, setStream] = useState(false);
  const [partialImages, setPartialImages] = useState("");
  const [user, setUser] = useState("");
  const [extraJson, setExtraJson] = useState("");
  const [rawJson, setRawJson] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [image, setImage] = useState(null);
  const [providerResponse, setProviderResponse] = useState(null);

  useEffect(() => {
    const savedApiUrl = window.localStorage.getItem("gpt_image_api_url") || CHANNEL_PRESETS[0].apiUrl;
    const savedFormat = window.localStorage.getItem("gpt_image_format") || CHANNEL_PRESETS[0].format;
    const savedModel = window.localStorage.getItem("gpt_image_model") || CHANNEL_PRESETS[0].model;
    const savedAuthMode = window.localStorage.getItem("gpt_image_auth_mode") || AUTH_OPTIONS[0].value;
    const matchingPreset = CHANNEL_PRESETS.find((preset) => (
      preset.apiUrl === savedApiUrl &&
      preset.format === savedFormat &&
      preset.model === savedModel &&
      preset.authMode === savedAuthMode
    ));

    setApiUrl(savedApiUrl);
    setApiKey(window.localStorage.getItem("gpt_image_api_key") || "");
    setAuthMode(savedAuthMode);
    setFormat(savedFormat);
    setModel(savedModel);
    setChannelPreset(matchingPreset?.value || "custom");
    setGeminiCase(window.localStorage.getItem("gpt_image_gemini_case") || GEMINI_CASE_PRESETS[0].value);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_api_url", apiUrl.trim());
  }, [apiUrl]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_api_key", apiKey.trim());
  }, [apiKey]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_auth_mode", authMode);
  }, [authMode]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_format", format);
  }, [format]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_model", model.trim());
  }, [model]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_channel_preset", channelPreset);
  }, [channelPreset]);

  useEffect(() => {
    window.localStorage.setItem("gpt_image_gemini_case", geminiCase);
  }, [geminiCase]);

  const payload = useMemo(() => {
    return buildImagePayload({
      background,
      extraJson,
      format,
      moderation,
      model,
      n,
      outputCompression,
      outputFormat,
      partialImages,
      prompt,
      quality,
      rawJson,
      size,
      stream,
      user,
    });
  }, [
    background,
    extraJson,
    format,
    model,
    moderation,
    n,
    outputCompression,
    outputFormat,
    partialImages,
    prompt,
    quality,
    rawJson,
    size,
    stream,
    user,
  ]);

  const payloadPreview = useMemo(() => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch (err) {
      return err.message;
    }
  }, [payload]);

  const imageSrc = imageDataUri(image, outputFormat);
  const downloadExtension = imageExtension(image, outputFormat);

  const apiHeaders = () => ({
    "x-api-url": apiUrl.trim(),
    "x-api-key": apiKey.trim(),
    "x-auth-mode": authMode,
  });

  const handleSubmit = async () => {
    if (!apiUrl.trim() || !apiKey.trim()) {
      setError("Enter the image API URL and key first.");
      return;
    }

    if (format !== IMAGE_FORMATS.raw && !prompt.trim()) {
      setError("Prompt is required unless using raw JSON.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setImage(null);
      setProviderResponse(null);

      const res = await fetch("/api/image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders(),
        },
        body: JSON.stringify({ payload }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed.");

      setImage(data.image);
      setProviderResponse(data.providerResponse || data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyChannelPreset = (value) => {
    setChannelPreset(value);
    const preset = CHANNEL_PRESETS.find((item) => item.value === value);
    if (!preset || value === "custom") return;

    setApiUrl(preset.apiUrl);
    setAuthMode(preset.authMode);
    setFormat(preset.format);
    setModel(preset.model);
    setOutputFormat(preset.outputFormat);
  };

  const applyGeminiCase = (value) => {
    setGeminiCase(value);
    const casePreset = GEMINI_CASE_PRESETS.find((item) => item.value === value);
    if (!casePreset || value === "none") return;

    applyChannelPreset("tokensea-gemini");

    if (casePreset.prompt) {
      setFormat(casePreset.format || IMAGE_FORMATS.gemini);
      setPrompt(casePreset.prompt);
      return;
    }

    setFormat(IMAGE_FORMATS.raw);
    setRawJson(rawJsonForCase(casePreset));
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl w-full mb-8 text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold text-foreground tracking-tight"
        >
          Image API Tester
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-muted max-w-3xl mx-auto leading-relaxed"
        >
          Submit image generation requests with your own endpoint and key.
        </motion.p>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-500">
              <FaImage />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Image Request Builder
              </h2>
              <p className="text-[10px] text-muted">OpenAI images and Gemini generateContent surfaces</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                API URL
              </span>
              <span className="relative block">
                <FaLink className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 text-[10px]" />
                <input
                  type="url"
                  value={apiUrl}
                  onChange={(event) => {
                    setApiUrl(event.target.value);
                    setChannelPreset("custom");
                  }}
                  placeholder={DEFAULT_IMAGE_API_URL}
                  className="w-full bg-glass-bg border border-glass-border rounded-md py-2 pl-8 pr-3 text-xs outline-none focus:border-primary-500/40"
                />
              </span>
            </label>

            <label className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                API Key
              </span>
              <span className="relative block">
                <FaKey className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500 text-[10px]" />
                <input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder="api key..."
                  className="w-full bg-glass-bg border border-glass-border rounded-md py-2 pl-8 pr-3 text-xs outline-none focus:border-primary-500/40"
                />
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <CustomSelect label="Channel" value={channelPreset} options={CHANNEL_PRESETS} onChange={applyChannelPreset} icon={FaLink} />
            <CustomSelect
              label="Request Format"
              value={format}
              options={FORMAT_OPTIONS}
              onChange={(value) => {
                setFormat(value);
                setChannelPreset("custom");
              }}
              icon={FaCode}
            />
            <CustomSelect
              label="Auth Header"
              value={authMode}
              options={AUTH_OPTIONS}
              onChange={(value) => {
                setAuthMode(value);
                setChannelPreset("custom");
              }}
              icon={FaKey}
            />
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Model
              </span>
              <input
                value={model}
                onChange={(event) => {
                  setModel(event.target.value);
                  setChannelPreset("custom");
                }}
                className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
              />
            </label>
          </div>

          {channelPreset === "tokensea-gemini" && (
            <CustomSelect
              label="Gemini Official Case"
              value={geminiCase}
              options={GEMINI_CASE_PRESETS}
              onChange={applyGeminiCase}
              icon={FaImage}
            />
          )}

          {format !== IMAGE_FORMATS.raw ? (
            <>
              <label className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Prompt
                </span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Describe the image to generate..."
                  className="w-full h-28 bg-glass-bg border border-glass-border rounded-md p-3 text-sm outline-none focus:border-primary-500/40 resize-none transition-colors custom-scrollbar"
                />
              </label>

              {format === IMAGE_FORMATS.openai && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CustomSelect label="Size" value={size} options={SIZE_OPTIONS} onChange={setSize} />
                    <CustomSelect label="Quality" value={quality} options={QUALITY_OPTIONS} onChange={setQuality} />
                    <CustomSelect label="Format" value={outputFormat} options={OUTPUT_FORMAT_OPTIONS} onChange={setOutputFormat} />
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                        Count
                      </span>
                      <input
                        value={n}
                        onChange={(event) => setN(event.target.value)}
                        inputMode="numeric"
                        className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <CustomSelect label="Background" value={background} options={BACKGROUND_OPTIONS} onChange={setBackground} />
                    <CustomSelect label="Moderation" value={moderation} options={MODERATION_OPTIONS} onChange={setModeration} />
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                        Compression
                      </span>
                      <input
                        value={outputCompression}
                        onChange={(event) => setOutputCompression(event.target.value)}
                        inputMode="numeric"
                        placeholder="0-100"
                        className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                      />
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                        Partial Images
                      </span>
                      <input
                        value={partialImages}
                        onChange={(event) => setPartialImages(event.target.value)}
                        inputMode="numeric"
                        placeholder="optional"
                        className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                      />
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 px-3 py-2 bg-glass-bg border border-glass-border rounded-md text-xs text-foreground">
                      <input
                        type="checkbox"
                        checked={stream}
                        onChange={(event) => setStream(event.target.checked)}
                        className="accent-primary-500"
                      />
                      Stream
                    </label>
                    <label className="space-y-1.5">
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                        User
                      </span>
                      <input
                        value={user}
                        onChange={(event) => setUser(event.target.value)}
                        placeholder="optional"
                        className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                      />
                    </label>
                  </div>
                </>
              )}

              <label className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Extra JSON
                </span>
                <textarea
                  value={extraJson}
                  onChange={(event) => setExtraJson(event.target.value)}
                  placeholder='{"custom_field": "value"}'
                  className="w-full h-24 bg-glass-bg border border-glass-border rounded-md p-3 font-mono text-xs outline-none focus:border-primary-500/40 resize-none custom-scrollbar"
                />
              </label>
            </>
          ) : (
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Raw Request JSON
              </span>
              <textarea
                value={rawJson}
                onChange={(event) => setRawJson(event.target.value)}
                placeholder={`{\n  "contents": [{\n    "role": "user",\n    "parts": [{ "text": "A studio product shot..." }]\n  }],\n  "generationConfig": {\n    "responseModalities": ["TEXT", "IMAGE"]\n  }\n}`}
                className="w-full h-80 bg-glass-bg border border-glass-border rounded-md p-3 font-mono text-xs outline-none focus:border-primary-500/40 resize-none custom-scrollbar"
              />
            </label>
          )}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !apiUrl.trim() || !apiKey.trim()}
            className="w-full bg-primary-500 text-white rounded-md py-2 text-sm font-medium hover:bg-primary-600 active:scale-[0.98] transition-all disabled:opacity-60"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              "Submit Image API Test"
            )}
          </button>

          {error && (
            <p className="text-[10px] text-red-500 font-medium text-center">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-4">
            <h2 className="text-[10px] font-medium text-muted uppercase tracking-wider">
              Payload Preview
            </h2>
            <pre className="min-h-72 max-h-[520px] overflow-auto custom-scrollbar bg-glass-hover border border-glass-border rounded-md p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-foreground">
              {payloadPreview}
            </pre>
          </div>

          <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-4 min-h-[420px]">
            <h2 className="text-[10px] font-medium text-muted uppercase tracking-wider">
              Response
            </h2>
            <div className="flex-1 flex flex-col items-center justify-center bg-glass-hover rounded-md border border-glass-border relative overflow-hidden group">
              {imageSrc ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
                  <div className="relative w-full max-w-lg aspect-square rounded-md overflow-hidden bg-white/50 shadow-inner">
                    <Image
                      src={imageSrc}
                      alt="Generated image"
                      fill
                      unoptimized
                      sizes="512px"
                      className="object-contain"
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a
                        href={imageSrc}
                        download={`image-${Date.now()}.${downloadExtension}`}
                        className="p-3 bg-white/90 hover:bg-white text-black rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90 flex"
                      >
                        <FiDownload className="text-xl" />
                      </a>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-medium text-muted uppercase tracking-widest animate-pulse">
                    Generating image...
                  </p>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FaImage className="text-2xl opacity-30 mx-auto" />
                  <p className="text-[10px] text-muted uppercase tracking-widest font-medium">
                    Awaiting Image
                  </p>
                </div>
              )}
            </div>
            {providerResponse && (
              <pre className="max-h-64 overflow-auto custom-scrollbar bg-glass-hover border border-glass-border rounded-md p-4 text-[11px] leading-relaxed whitespace-pre-wrap font-mono text-foreground">
                {JSON.stringify(providerResponse, null, 2)}
              </pre>
            )}
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 0px;
        }
        .custom-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
