"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FaBolt,
  FaChevronDown,
  FaCode,
  FaKey,
  FaLink,
  FaMagic,
  FaPlus,
  FaTrash,
} from "react-icons/fa";
import { FiDownload } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { downloadMedia } from "@/lib/utils";
import {
  SEEDANCE_FORMATS,
  buildSeedancePayload,
  mediaUrl,
} from "@/lib/seedance-payload";

const FORMAT_OPTIONS = [
  { value: SEEDANCE_FORMATS.official, label: "Volcengine Official" },
  { value: SEEDANCE_FORMATS.raw, label: "Raw JSON" },
];

const AUTH_OPTIONS = [
  { value: "bearer", label: "Bearer" },
  { value: "api-key", label: "x-api-key" },
  { value: "both", label: "Both" },
];

const RATIO_OPTIONS = ["adaptive", "16:9", "9:16", "1:1", "4:3", "3:4", "21:9"].map((value) => ({
  value,
  label: value,
}));

const RESOLUTION_OPTIONS = ["480p", "720p", "1080p"].map((value) => ({
  value,
  label: value,
}));

const DURATION_OPTIONS = [-1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map((value) => ({
  value: String(value),
  label: value === -1 ? "Auto (-1)" : `${value}s`,
}));

const DEFAULT_API_URL = "https://ark.cn-beijing.volces.com/api/v3/contents/generations/tasks";
const DEFAULT_MODEL = "doubao-seedance-2-0-260128";
const IMAGE_ROLE_OPTIONS = [
  { value: "", label: "No role" },
  { value: "first_frame", label: "first_frame" },
  { value: "last_frame", label: "last_frame" },
  { value: "reference_image", label: "reference_image" },
];
const VIDEO_ROLE_OPTIONS = [{ value: "reference_video", label: "reference_video" }];
const AUDIO_ROLE_OPTIONS = [{ value: "reference_audio", label: "reference_audio" }];

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
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              className="absolute top-10 left-0 right-0 bg-glass-bg border border-glass-border rounded-md shadow-xl z-[100] overflow-hidden backdrop-blur-xl"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function Home() {
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authMode, setAuthMode] = useState(AUTH_OPTIONS[0].value);
  const [format, setFormat] = useState(SEEDANCE_FORMATS.official);

  const [model, setModel] = useState(DEFAULT_MODEL);
  const [prompt, setPrompt] = useState("");
  const [ratio, setRatio] = useState("adaptive");
  const [resolution, setResolution] = useState("720p");
  const [duration, setDuration] = useState("5");
  const [seed, setSeed] = useState("");
  const [serviceTier, setServiceTier] = useState("");
  const [callbackUrl, setCallbackUrl] = useState("");
  const [watermark, setWatermark] = useState(false);
  const [cameraFixed, setCameraFixed] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(false);
  const [returnLastFrame, setReturnLastFrame] = useState(false);

  const [imageUrls, setImageUrls] = useState([]);
  const [videoUrls, setVideoUrls] = useState([]);
  const [audioUrls, setAudioUrls] = useState([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [newAudioUrl, setNewAudioUrl] = useState("");
  const [newImageRole, setNewImageRole] = useState("");
  const [newVideoRole, setNewVideoRole] = useState("reference_video");
  const [newAudioRole, setNewAudioRole] = useState("reference_audio");
  const [extraJson, setExtraJson] = useState("");
  const [rawJson, setRawJson] = useState("");

  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultUrl, setResultUrl] = useState(null);
  const [providerResponse, setProviderResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setApiUrl(window.localStorage.getItem("seedance_api_url") || DEFAULT_API_URL);
    setApiKey(window.localStorage.getItem("seedance_api_key") || "");
    setAuthMode(window.localStorage.getItem("seedance_auth_mode") || AUTH_OPTIONS[0].value);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("seedance_api_url", apiUrl.trim());
  }, [apiUrl]);

  useEffect(() => {
    window.localStorage.setItem("seedance_api_key", apiKey.trim());
  }, [apiKey]);

  useEffect(() => {
    window.localStorage.setItem("seedance_auth_mode", authMode);
  }, [authMode]);

  const metadata = useMemo(
    () => ({
      prompt,
      ratio,
      resolution,
      duration,
      model,
      images: imageUrls.map(mediaUrl),
      videos: videoUrls.map(mediaUrl),
      audios: audioUrls.map(mediaUrl),
    }),
    [audioUrls, duration, imageUrls, model, prompt, ratio, resolution, videoUrls],
  );

  const payloadState = useMemo(() => {
    try {
      return {
        payload: buildSeedancePayload({
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
          images: imageUrls,
          videos: videoUrls,
          audios: audioUrls,
        }),
        error: null,
      };
    } catch (err) {
      return { payload: null, error: err.message };
    }
  }, [
    audioUrls,
    callbackUrl,
    cameraFixed,
    duration,
    extraJson,
    format,
    generateAudio,
    imageUrls,
    model,
    prompt,
    ratio,
    rawJson,
    resolution,
    returnLastFrame,
    seed,
    serviceTier,
    videoUrls,
    watermark,
  ]);

  const payloadPreview = useMemo(() => {
    if (payloadState.error) return payloadState.error;
    return JSON.stringify(payloadState.payload, null, 2);
  }, [payloadState]);

  const apiHeaders = () => ({
    "x-api-url": apiUrl.trim(),
    "x-api-key": apiKey.trim(),
    "x-auth-mode": authMode,
  });

  const addUrl = (value, role, setter, list, resetter) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    setter([...list, { url: trimmed, role }]);
    resetter("");
  };

  const removeUrl = (setter, list, index) => {
    setter(list.filter((_, currentIndex) => currentIndex !== index));
  };

  const requireConfig = () => {
    if (apiUrl.trim() && apiKey.trim()) return true;
    setError("Enter the Seedance API URL and key first.");
    return false;
  };

  const pollStatus = async (requestId) => {
    setStatusMessage("Polling task status...");

    try {
      const res = await fetch("/api/seedance/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders(),
        },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Status check failed.");
      setProviderResponse(data.providerResponse || data);

      if (data.status === "completed") {
        setResultUrl(data.imageUrl);
        setLoading(false);
      } else if (data.status === "failed") {
        throw new Error(data.error || "Generation failed.");
      } else {
        setTimeout(() => pollStatus(requestId), 3000);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!requireConfig()) return;
    if (payloadState.error) {
      setError(payloadState.error);
      return;
    }
    if (format !== SEEDANCE_FORMATS.raw && !payloadState.payload.content.length) {
      setError("Add at least one official content item.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResultUrl(null);
      setProviderResponse(null);
      setStatusMessage("Submitting generation request...");

      const res = await fetch("/api/seedance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...apiHeaders(),
        },
        body: JSON.stringify({ payload: payloadState.payload, metadata }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed.");
      setProviderResponse(data.providerResponse || data);

      if (data.status === "completed") {
        setResultUrl(data.imageUrl);
        setLoading(false);
        return;
      }

      if (!data.request_id) throw new Error("No task id received.");
      await pollStatus(data.request_id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 w-full flex flex-col items-center p-4 md:p-8 overflow-y-auto custom-scrollbar">
      <div className="max-w-7xl w-full mb-8 text-center space-y-4">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-bold text-foreground tracking-tight"
        >
          Seedance 2.0 API Tester
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-sm md:text-base text-muted max-w-3xl mx-auto leading-relaxed"
        >
          Build and submit official-compatible Seedance video generation requests with your own endpoint and key.
        </motion.p>
      </div>

      <div className="max-w-7xl w-full grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
        <div className="bg-glass-bg border border-glass-border rounded-lg p-6 flex flex-col gap-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-md bg-primary-500/10 flex items-center justify-center text-primary-500">
              <FaMagic />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground uppercase tracking-wider">
                Request Builder
              </h2>
              <p className="text-[10px] text-muted">Official-compatible coverage surface</p>
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
                  onChange={(event) => setApiUrl(event.target.value)}
                  placeholder={DEFAULT_API_URL}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <CustomSelect label="Request Format" value={format} options={FORMAT_OPTIONS} onChange={setFormat} icon={FaCode} />
            <CustomSelect label="Auth Header" value={authMode} options={AUTH_OPTIONS} onChange={setAuthMode} icon={FaKey} />
            <label className="space-y-1.5">
              <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                Model
              </span>
              <input
                value={model}
                onChange={(event) => setModel(event.target.value)}
                className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
              />
            </label>
          </div>

          {format !== SEEDANCE_FORMATS.raw ? (
            <>
              <label className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                  Text
                </span>
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Optional text prompt..."
                  className="w-full h-28 bg-glass-bg border border-glass-border rounded-md p-3 text-sm outline-none focus:border-primary-500/40 resize-none transition-colors custom-scrollbar"
                />
              </label>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <CustomSelect label="Ratio" value={ratio} options={RATIO_OPTIONS} onChange={setRatio} />
                <CustomSelect label="Resolution" value={resolution} options={RESOLUTION_OPTIONS} onChange={setResolution} />
                <CustomSelect label="Duration" value={duration} options={DURATION_OPTIONS} onChange={setDuration} />
                <label className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Seed
                  </span>
                  <input
                    value={seed}
                    onChange={(event) => setSeed(event.target.value)}
                    inputMode="numeric"
                    placeholder="optional"
                    className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ["Watermark", watermark, setWatermark],
                  ["Camera Fixed", cameraFixed, setCameraFixed],
                  ["Generate Audio", generateAudio, setGenerateAudio],
                  ["Return Last Frame", returnLastFrame, setReturnLastFrame],
                ].map(([label, checked, setter]) => (
                  <label key={label} className="flex items-center gap-2 px-3 py-2 bg-glass-bg border border-glass-border rounded-md text-xs text-foreground">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => setter(event.target.checked)}
                      className="accent-primary-500"
                    />
                    {label}
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Service Tier
                  </span>
                  <input
                    value={serviceTier}
                    onChange={(event) => setServiceTier(event.target.value)}
                    placeholder="optional"
                    className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                  />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                    Callback URL
                  </span>
                  <input
                    value={callbackUrl}
                    onChange={(event) => setCallbackUrl(event.target.value)}
                    placeholder="optional"
                    className="w-full bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <MediaList
                  label="Images"
                  value={newImageUrl}
                  setValue={setNewImageUrl}
                  role={newImageRole}
                  setRole={setNewImageRole}
                  roleOptions={IMAGE_ROLE_OPTIONS}
                  items={imageUrls}
                  addItem={() => addUrl(newImageUrl, newImageRole, setImageUrls, imageUrls, setNewImageUrl)}
                  removeItem={(index) => removeUrl(setImageUrls, imageUrls, index)}
                  preview="image"
                />
                <MediaList
                  label="Videos"
                  value={newVideoUrl}
                  setValue={setNewVideoUrl}
                  role={newVideoRole}
                  setRole={setNewVideoRole}
                  roleOptions={VIDEO_ROLE_OPTIONS}
                  items={videoUrls}
                  addItem={() => addUrl(newVideoUrl, newVideoRole, setVideoUrls, videoUrls, setNewVideoUrl)}
                  removeItem={(index) => removeUrl(setVideoUrls, videoUrls, index)}
                  preview="video"
                />
                <MediaList
                  label="Audio"
                  value={newAudioUrl}
                  setValue={setNewAudioUrl}
                  role={newAudioRole}
                  setRole={setNewAudioRole}
                  roleOptions={AUDIO_ROLE_OPTIONS}
                  items={audioUrls}
                  addItem={() => addUrl(newAudioUrl, newAudioRole, setAudioUrls, audioUrls, setNewAudioUrl)}
                  removeItem={(index) => removeUrl(setAudioUrls, audioUrls, index)}
                  preview="audio"
                />
              </div>

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
                placeholder={`{\n  "model": "${DEFAULT_MODEL}",\n  "content": [\n    { "type": "text", "text": "A cinematic shot..." }\n  ],\n  "ratio": "16:9",\n  "resolution": "720p",\n  "duration": 5\n}`}
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
              "Submit Official API Test"
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
              {resultUrl ? (
                <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-4">
                  <div className="relative w-full aspect-video rounded-md overflow-hidden bg-black shadow-inner">
                    <video
                      src={resultUrl}
                      className="w-full h-full object-contain"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                    />
                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => downloadMedia(resultUrl, `seedance-${Date.now()}.mp4`)}
                        className="p-3 bg-white/90 hover:bg-white text-black rounded-full shadow-2xl transition-all hover:scale-110 active:scale-90"
                      >
                        <FiDownload className="text-xl" />
                      </button>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-10 h-10 border-2 border-primary-500/20 border-t-primary-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-medium text-muted uppercase tracking-widest animate-pulse">
                    {statusMessage}
                  </p>
                </div>
              ) : (
                <div className="text-center p-8 space-y-3">
                  <FaBolt className="text-2xl opacity-30 mx-auto" />
                  <p className="text-[10px] text-muted uppercase tracking-widest font-medium">
                    Awaiting Response
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

function MediaList({ label, value, setValue, role, setRole, roleOptions, items, addItem, removeItem, preview }) {
  const placeholderLabel = label === "Audio" ? "Audio" : label.slice(0, -1);

  return (
    <div className="space-y-3">
      <label className="text-[10px] font-medium text-muted uppercase tracking-wider">
        {label} ({items.length})
      </label>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={`${placeholderLabel} URL...`}
          className="flex-1 bg-glass-bg border border-glass-border rounded-md px-3 py-2 text-xs outline-none focus:border-primary-500/40"
        />
        <button
          type="button"
          onClick={addItem}
          disabled={!value.trim()}
          className="w-9 h-9 bg-glass-bg border border-glass-border text-primary-500 rounded-md flex items-center justify-center hover:bg-primary-500 hover:text-white transition-colors disabled:opacity-50"
        >
          <FaPlus />
        </button>
      </div>
      {roleOptions?.length > 1 && (
        <CustomSelect label="Role" value={role} options={roleOptions} onChange={setRole} />
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {items.map((item, index) => {
            const url = mediaUrl(item);
            const itemRole = typeof item === "string" ? "" : item.role;

            return (
            <div
              key={`${url}-${index}`}
              className="relative aspect-square rounded-md bg-glass-bg overflow-hidden group border border-glass-border"
            >
              {preview === "image" ? (
                <Image
                  src={url}
                  alt={`${label} ${index + 1}`}
                  fill
                  sizes="96px"
                  unoptimized
                  className="w-full h-full object-cover"
                />
              ) : preview === "video" ? (
                <video src={url} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-2 text-[9px] text-muted text-center break-all">
                  {url.split("/").pop() || url}
                </div>
              )}
              {itemRole && (
                <span className="absolute left-1 bottom-1 max-w-[calc(100%-0.5rem)] truncate rounded bg-black/70 px-1.5 py-0.5 text-[8px] text-white">
                  {itemRole}
                </span>
              )}
              <button
                type="button"
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-1 rounded bg-red-500/90 items-center justify-center hidden group-hover:flex"
              >
                <FaTrash className="text-white text-[10px]" />
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
