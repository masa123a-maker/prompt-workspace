"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Dice5, RotateCcw, History, Check, Copy, Search, Wand2, Save, Trash2, Upload } from "lucide-react";

// --- Simple UI replacements (no shadcn needed) ---
const Card = ({ children, className }) => <div className={`bg-white rounded-3xl shadow-sm p-4 ${className || ""}`}>{children}</div>;
const CardHeader = ({ children }) => <div className="mb-3">{children}</div>;
const CardTitle = ({ children, className }) => <h2 className={`font-semibold ${className || ""}`}>{children}</h2>;
const CardDescription = ({ children }) => <p className="text-sm text-zinc-600">{children}</p>;
const CardContent = ({ children }) => <div className="space-y-3">{children}</div>;
const Button = ({ children, onClick, disabled, className }) => (
  <button onClick={onClick} disabled={disabled} className={`px-4 py-2 rounded-2xl border ${disabled ? "opacity-50" : "hover:bg-zinc-100"} ${className || ""}`}>
    {children}
  </button>
);
const Badge = ({ children }) => <span className="px-2 py-1 text-xs bg-zinc-200 rounded">{children}</span>;
const ScrollArea = ({ children, className }) => <div className={`overflow-y-auto ${className || ""}`}>{children}</div>;
const Separator = () => <hr className="border-zinc-200" />;
const Input = ({ value, onChange, placeholder }) => (
  <input value={value} onChange={onChange} placeholder={placeholder} className="w-full border rounded-2xl px-3 py-2" />
);

const STORAGE_KEYS = {
  manualHistory: "prompt-generator-manual-history-v2",
  trendHistory: "prompt-generator-trend-history-v2",
  activeTab: "prompt-generator-active-tab-v2",
  importedTrendOptions: "prompt-generator-imported-trend-options-v1",
  savedTrendSets: "prompt-generator-saved-trend-sets-v1",
};

const OPTION_GROUPS = {
  season: {
    label: "季節",
    options: [
      { id: "spring", label: "春", en: "spring" },
      { id: "summer", label: "夏", en: "summer" },
      { id: "autumn", label: "秋", en: "autumn" },
      { id: "winter", label: "冬", en: "winter" },
    ],
  },
  hair: {
    label: "ヘア",
    options: [
      { id: "soft-bob", label: "やわらかいボブ", en: "a soft bob with airy movement" },
      { id: "long-straight", label: "ロングストレート", en: "long straight dark hair with a graceful sheen" },
      { id: "loose-wave", label: "ゆるいウェーブ", en: "loosely waved hair drifting gently in the air" },
      { id: "updo", label: "上品なアップ", en: "an elegant updo with delicate loose strands" },
    ],
  },
  makeup: {
    label: "メイク",
    options: [
      { id: "natural-glow", label: "自然なツヤ", en: "natural luminous makeup with a soft healthy glow" },
      { id: "dewy", label: "みずみずしい質感", en: "dewy skin and subtly radiant highlights" },
      { id: "rosy", label: "ローズ系", en: "a refined rosy palette with gentle warmth" },
      { id: "minimal", label: "ミニマル", en: "minimal makeup that enhances quiet natural beauty" },
    ],
  },
  wear: {
    label: "ウェア",
    options: [
      { id: "spring-dress", seasons: ["spring"], label: "軽やかな春ワンピ", en: "a light flowing spring dress in soft pastel tones" },
      { id: "summer-sleeveless", seasons: ["summer"], label: "夏のノースリーブ", en: "a breezy sleeveless summer dress in airy fabric" },
      { id: "autumn-knit", seasons: ["autumn"], label: "秋の薄手ニット", en: "a fine autumn knit paired with a graceful skirt" },
      { id: "winter-coat", seasons: ["winter"], label: "冬のロングコート", en: "a long winter coat layered over an elegant refined outfit" },
      { id: "timeless-blouse", seasons: ["spring", "autumn"], label: "ブラウス×スカート", en: "a timeless blouse and skirt with a polished feminine silhouette" },
    ],
  },
  accessory: {
    label: "アクセサリ",
    options: [
      { id: "pearl", label: "パール", en: "delicate pearl accessories" },
      { id: "gold", label: "華奢なゴールド", en: "fine gold jewelry with understated elegance" },
      { id: "sun-umbrella", label: "日傘", en: "a refined parasol carried with effortless grace" },
      { id: "scarf", label: "細スカーフ", en: "a slender scarf adding a subtle note of sophistication" },
    ],
  },
  pose: {
    label: "ポーズ",
    options: [
      { id: "walking", label: "歩く", en: "walking at an unhurried pace with gentle confidence" },
      { id: "turning", label: "振り返る", en: "turning slightly as if noticing a tender distant moment" },
      { id: "standing", label: "静かに立つ", en: "standing quietly with poised natural elegance" },
      { id: "touching-hair", label: "髪に触れる", en: "lightly touching her hair in a candid fleeting gesture" },
    ],
  },
  background: {
    label: "背景",
    options: [
      { id: "tokyo-street", seasons: ["spring", "summer", "autumn"], label: "東京の街", en: "a modern Tokyo street softened by depth and atmosphere" },
      { id: "riverside", seasons: ["spring", "summer", "autumn"], label: "川沿い", en: "a calm riverside path with subtle reflections and open air" },
      { id: "autumn-park", seasons: ["autumn"], label: "紅葉の公園", en: "an autumn park layered with delicate falling leaves" },
      { id: "winter-city", seasons: ["winter"], label: "冬の街角", en: "a winter city corner with crisp air and soft urban light" },
      { id: "studio-minimal", label: "ミニマルなスタジオ", en: "a minimal studio space with elegant negative space" },
    ],
  },
  mood: {
    label: "ムード",
    options: [
      { id: "poetic", label: "詩的", en: "poetic and quietly evocative" },
      { id: "nostalgic", label: "少しノスタルジック", en: "slightly nostalgic yet luminous" },
      { id: "fresh", label: "みずみずしい", en: "fresh, clean, and full of gentle life" },
      { id: "cinematic", label: "シネマティック", en: "cinematic, intimate, and emotionally resonant" },
    ],
  },
  lighting: {
    label: "ライティング",
    options: [
      { id: "soft-daylight", label: "やわらかな自然光", en: "soft natural daylight with tender shadows" },
      { id: "golden-hour", label: "夕方の光", en: "golden-hour light wrapping the scene in warmth" },
      { id: "overcast", label: "薄曇りの拡散光", en: "gentle overcast light with smooth elegant diffusion" },
      { id: "window-light", label: "窓辺の光", en: "window light sculpting the face with quiet delicacy" },
    ],
  },
};

const GROUP_ORDER = ["season", "hair", "makeup", "wear", "accessory", "pose", "background", "mood", "lighting"];

const VIDEO_HINTS = {
  walking: "she continues in one unbroken motion, her steps naturally flowing forward as fabric and hair respond to the air",
  turning: "she turns slowly and seamlessly, as if drawn by a memory just outside the frame",
  standing: "a subtle shift of breath, posture, and gaze creates a continuous living stillness",
  "touching-hair": "her fingers rise gently to her hair in a fluid, continuous gesture, catching tiny movements of light",
  default: "a single continuous cinematic motion, natural and unhurried, with subtle movement in hair, fabric, and gaze",
};

const TREND_LOOKBOOK = {
  spring: {
    styles: [
      "a sheer layered blouse with a fluid midi skirt",
      "a soft pastel dress with a light tailored outer layer",
      "a clean blouse and skirt silhouette with delicate movement",
      "a polished cardigan and airy dress styled with modern restraint",
    ],
    scenes: [
      "a refined Tokyo street lined with fresh greenery",
      "a calm riverside promenade touched by pale spring light",
      "an elegant urban corner with quiet depth and polished storefront reflections",
    ],
    lighting: [
      "soft spring daylight with translucent shadows",
      "gentle overcast diffusion that flatters texture and skin",
      "late-afternoon light with a subtle golden softness",
    ],
  },
  summer: {
    styles: [
      "a sleeveless dress in breathable fabric with a clean feminine line",
      "a minimal UV-cut layer over a refined summer silhouette",
      "a light sporty-elegant look with a smooth I-line skirt",
      "an airy monochrome ensemble styled for heat and brightness",
    ],
    scenes: [
      "a bright Tokyo avenue shimmering in early summer clarity",
      "a shaded walkway with moving leaves and reflected heat haze",
      "a modern terrace touched by open sky and city air",
    ],
    lighting: [
      "clear summer daylight with crisp but graceful contrast",
      "bright reflected light softened by airy atmosphere",
      "a warm sunlit glow balanced by clean urban shadow",
    ],
  },
  autumn: {
    styles: [
      "a fine knit with a graceful skirt in muted seasonal tones",
      "a blouse layered under a light jacket with elegant structure",
      "a refined tonal outfit with texture-rich autumn softness",
      "a quietly luxurious silhouette in earth and berry notes",
    ],
    scenes: [
      "a Tokyo park scattered with autumn leaves",
      "a calm city street with subdued seasonal color and depth",
      "a riverside path wrapped in soft, fading warmth",
    ],
    lighting: [
      "golden-hour light deepening fabric texture and mood",
      "soft cloudy light with rich tonal balance",
      "a low autumn sun creating cinematic contour and warmth",
    ],
  },
  winter: {
    styles: [
      "a long elegant coat over a refined winter look",
      "a minimal layered outfit with quiet structure and warmth",
      "a monochrome winter ensemble with soft luxurious texture",
      "a tailored outerwear silhouette with delicate feminine detail",
    ],
    scenes: [
      "a crisp Tokyo street corner under pale winter air",
      "a quiet city passage with clean lines and subtle glow",
      "a modern urban setting enriched by cool seasonal stillness",
    ],
    lighting: [
      "clear winter light with clean, sculpted contrast",
      "soft urban dusk with luminous windows and cool air",
      "pale daylight with calm reflective highlights",
    ],
  },
};

function sample(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function safeStorageGet(key, fallback) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return fallback;
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function safeStorageSet(key, value) {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage failures in sandboxed environments
  }
}

function createId() {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  } catch {
    // ignore
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function compatibleOptions(groupKey, selectedSeason) {
  return OPTION_GROUPS[groupKey].options.filter((opt) => !opt.seasons || !selectedSeason || opt.seasons.includes(selectedSeason));
}

function countSelected(selection) {
  return Object.values(selection).filter(Boolean).length;
}

function randomCompatibleSelection() {
  const season = sample(OPTION_GROUPS.season.options).id;
  const next = { season };
  for (const key of GROUP_ORDER.filter((k) => k !== "season")) {
    const pool = compatibleOptions(key, season);
    next[key] = sample(pool)?.id;
  }
  return next;
}

function buildPrompt(selection) {
  const picked = {};
  for (const key of GROUP_ORDER) {
    const item = OPTION_GROUPS[key].options.find((o) => o.id === selection[key]);
    if (item) picked[key] = item;
  }

  const parts = [
    "A naturally beautiful woman portrayed with refined realism and emotional subtlety.",
    picked.season ? `Set in ${picked.season.en},` : "",
    picked.hair?.en,
    picked.makeup?.en,
    picked.wear?.en,
    picked.accessory?.en,
    picked.pose?.en,
    picked.background?.en,
    picked.mood?.en,
    picked.lighting?.en,
    "highly detailed, elegant composition, realistic texture, graceful atmosphere, cinematic fashion photography",
  ].filter(Boolean);

  const videoHint = VIDEO_HINTS[picked.pose?.id] || VIDEO_HINTS.default;
  return `${parts.join(", ")}.\n\n--video_hint: ${videoHint}`;
}

function detectSeasonFromKeyword(keyword) {
  const lower = keyword.toLowerCase();
  if (["春", "spring", "3月", "4月", "5月"].some((k) => lower.includes(k))) return "spring";
  if (["夏", "summer", "6月", "7月", "8月"].some((k) => lower.includes(k))) return "summer";
  if (["秋", "autumn", "fall", "9月", "10月", "11月"].some((k) => lower.includes(k))) return "autumn";
  if (["冬", "winter", "12月", "1月", "2月"].some((k) => lower.includes(k))) return "winter";
  return "spring";
}

function inferTrendSignals(keyword) {
  const lower = keyword.toLowerCase();
  const signals = [];
  if (lower.includes("東京") || lower.includes("tokyo")) signals.push("Tokyo city styling remains clean, polished, and slightly understated");
  if (lower.includes("trend") || lower.includes("トレンド")) signals.push("current styling leans toward refined realism rather than excessive ornament");
  if (lower.includes("5月") || lower.includes("may")) signals.push("the season supports light layers, breathable fabrics, and fresh color accents");
  if (lower.includes("初め") || lower.includes("early")) signals.push("early-season dressing favors transitional layering and soft natural light");
  if (signals.length === 0) {
    signals.push("the styling direction favors elegant wearability, texture, and realistic atmosphere");
    signals.push("urban fashion cues suggest balance between trend awareness and quiet sophistication");
  }
  return signals;
}

function buildTrendPrompt({ keyword, season, index }) {
  const bank = TREND_LOOKBOOK[season] || TREND_LOOKBOOK.spring;
  const style = bank.styles[index % bank.styles.length];
  const scene = bank.scenes[(index + 1) % bank.scenes.length];
  const light = bank.lighting[(index + 2) % bank.lighting.length];
  const signals = inferTrendSignals(keyword);

  return {
    title: `Prompt ${index + 1}`,
    insight: signals[index % signals.length],
    prompt:
      `A naturally beautiful woman styled in a current ${season} Tokyo-inspired fashion direction, ${style}, set within ${scene}, ` +
      `${light}, poetic yet realistic, refined and cinematic, graceful fabric movement, emotionally resonant atmosphere, highly detailed fashion photography.\n\n` +
      `--video_hint: a continuous cinematic sequence with subtle walking, shifting gaze, and natural movement in hair and fabric, as if captured in one seamless flowing moment.`,
  };
}

async function copyTextToClipboard(text) {
  if (!text || typeof window === "undefined" || typeof document === "undefined") {
    return { ok: false, method: "unavailable", reason: "no-text-or-dom" };
  }

  try {
    if (window.isSecureContext && navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return { ok: true, method: "clipboard" };
    }
  } catch {
    // fall through to legacy method
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "true");
    textarea.style.position = "fixed";
    textarea.style.top = "0";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);

    const copied = typeof document.execCommand === "function" ? document.execCommand("copy") : false;
    document.body.removeChild(textarea);

    if (copied) {
      return { ok: true, method: "execCommand" };
    }
  } catch {
    // continue to manual fallback
  }

  return { ok: false, method: "manual", reason: "clipboard-blocked" };
}

function runSelfTests() {
  const failures = [];

  if (countSelected({ season: "spring", hair: "soft-bob", mood: "poetic" }) !== 3) {
    failures.push("countSelected should count truthy selections");
  }

  if (detectSeasonFromKeyword("2026年5月初め・東京のトレンドスタイル") !== "spring") {
    failures.push("detectSeasonFromKeyword should detect spring from May keyword");
  }

  const winterBackgrounds = compatibleOptions("background", "winter").map((item) => item.id);
  if (!winterBackgrounds.includes("winter-city") || winterBackgrounds.includes("autumn-park")) {
    failures.push("compatibleOptions should filter seasonal backgrounds");
  }

  const prompt = buildPrompt({ season: "spring", pose: "walking", mood: "poetic" });
  if (!prompt.includes("--video_hint:") || !prompt.includes("Set in spring")) {
    failures.push("buildPrompt should include season and video hint");
  }

  const trendPrompt = buildTrendPrompt({ keyword: "東京 トレンド", season: "spring", index: 0 });
  if (!trendPrompt.prompt.includes("Tokyo-inspired") || !trendPrompt.title.includes("Prompt 1")) {
    failures.push("buildTrendPrompt should produce stable prompt cards");
  }

  return failures;
}

function normalizeImportedOptions(raw) {
  const allowedKeys = ["hair", "makeup", "wear", "accessory", "background", "mood"];
  const normalized = {
    hair: [],
    makeup: [],
    wear: [],
    accessory: [],
    background: [],
    mood: [],
  };

  for (const key of allowedKeys) {
    const items = Array.isArray(raw?.[key]) ? raw[key] : [];
    normalized[key] = items
      .map((item, index) => {
        if (!item || typeof item !== "object") return null;
        const label = typeof item.label === "string" ? item.label.trim() : "";
        const en = typeof item.en === "string" ? item.en.trim() : "";
        if (!label || !en) return null;
        return {
          id: item.id || `imported-${key}-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
          label,
          en,
          imported: true,
        };
      })
      .filter(Boolean);
  }

  return normalized;
}

function mergeOptions(baseOptions, importedOptions) {
  const merged = {};
  for (const key of Object.keys(baseOptions)) {
    const base = baseOptions[key].options || [];
    const extra = importedOptions[key] || [];
    const seen = new Set();
    const combined = [...base, ...extra].filter((item) => {
      const sig = `${item.label}__${item.en}`;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
    merged[key] = {
      ...baseOptions[key],
      options: combined,
    };
  }
  return merged;
}

function SelectionChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-3 py-2 text-sm transition-all ${active ? "border-black bg-black text-white shadow" : "border-zinc-200 bg-white hover:border-zinc-400"}`}
    >
      <span className="inline-flex items-center gap-2">
        {active ? <Check className="h-4 w-4" /> : null}
        {children}
      </span>
    </button>
  );
}

function SectionTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: "manual", label: "選択式プロンプト生成" },
    { id: "trend", label: "キーワード→トレンド生成" },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          type="button"
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`rounded-2xl px-4 py-2 text-sm transition ${activeTab === tab.id ? "bg-black text-white" : "border border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400"}`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function CopyStatus({ state, manualText }) {
  if (state === "idle") return null;
  if (state === "copied") {
    return <div className="text-sm text-zinc-600">コピーしました。</div>;
  }
  if (state === "manual") {
    return (
      <div className="space-y-2 text-sm text-zinc-600">
        <div>この環境では自動コピーが制限されています。下の欄から手動でコピーしてください。</div>
        <textarea
          readOnly
          value={manualText}
          className="min-h-[120px] w-full rounded-2xl border border-zinc-200 bg-white p-3 text-xs leading-6 text-zinc-800"
          onFocus={(e) => e.currentTarget.select()}
        />
      </div>
    );
  }
  return <div className="text-sm text-zinc-600">コピーできませんでした。もう一度お試しください。</div>;
}

function ManualPromptApp() {
  const [selection, setSelection] = useState({});
  const [importedOptions, setImportedOptions] = useState({
    hair: [],
    makeup: [],
    wear: [],
    accessory: [],
    background: [],
    mood: [],
  });
  const [importText, setImportText] = useState(`{
  "hair": [
    { "label": "軽いレイヤーボブ", "en": "a light layered bob with airy movement" }
  ],
  "makeup": [
    { "label": "透け感ツヤ肌", "en": "sheer luminous makeup with translucent glowing skin" }
  ],
  "wear": [
    { "label": "シアー素材の軽羽織", "en": "a sheer light outer layer with soft translucency" }
  ],
  "accessory": [
    { "label": "ミニマルなシルバーピアス", "en": "minimal silver earrings with a clean modern accent" }
  ],
  "background": [
    { "label": "新緑の表参道", "en": "Omotesando lined with fresh spring greenery and refined storefronts" }
  ],
  "mood": [
    { "label": "都会的でみずみずしい", "en": "urban, fresh, and quietly sophisticated" }
  ]
}`);
  const [importStatus, setImportStatus] = useState("idle");
  const [savedTrendSets, setSavedTrendSets] = useState([]);
  const [trendSetName, setTrendSetName] = useState("");
  const [output, setOutput] = useState("");
  const [history, setHistory] = useState([]);
  const [copyState, setCopyState] = useState("idle");
  const [manualCopyText, setManualCopyText] = useState("");

  useEffect(() => {
    setHistory(safeStorageGet(STORAGE_KEYS.manualHistory, []));
    setImportedOptions(
      safeStorageGet(STORAGE_KEYS.importedTrendOptions, {
        hair: [],
        makeup: [],
        wear: [],
        accessory: [],
        background: [],
        mood: [],
      })
    );
    setSavedTrendSets(safeStorageGet(STORAGE_KEYS.savedTrendSets, []));
  }, []);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.manualHistory, history);
  }, [history]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.importedTrendOptions, importedOptions);
  }, [importedOptions]);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.savedTrendSets, savedTrendSets);
  }, [savedTrendSets]);

  const mergedOptionGroups = useMemo(() => mergeOptions(OPTION_GROUPS, importedOptions), [importedOptions]);
  const selectedCount = useMemo(() => countSelected(selection), [selection]);
  const canGenerate = selectedCount >= 3;
  const selectedSeason = selection.season;

  const toggleSelection = (groupKey, optionId) => {
    setSelection((prev) => {
      const next = { ...prev, [groupKey]: prev[groupKey] === optionId ? undefined : optionId };
      if (groupKey === "season") {
        for (const dep of ["wear", "background"]) {
          const current = mergedOptionGroups[dep].options.find((o) => o.id === next[dep]);
          if (current?.seasons && !current.seasons.includes(optionId)) next[dep] = undefined;
        }
      }
      return next;
    });
  };

  const importTrendOptions = () => {
    try {
      const parsed = JSON.parse(importText);
      const normalized = normalizeImportedOptions(parsed);
      setImportedOptions((prev) => ({
        hair: [...prev.hair, ...normalized.hair],
        makeup: [...prev.makeup, ...normalized.makeup],
        wear: [...prev.wear, ...normalized.wear],
        accessory: [...prev.accessory, ...normalized.accessory],
        background: [...prev.background, ...normalized.background],
        mood: [...prev.mood, ...normalized.mood],
      }));
      setImportStatus("success");
      window.setTimeout(() => setImportStatus("idle"), 1500);
    } catch {
      setImportStatus("error");
    }
  };

  const clearImportedOptions = () => {
    setImportedOptions({
      hair: [],
      makeup: [],
      wear: [],
      accessory: [],
      background: [],
      mood: [],
    });
    setImportStatus("idle");
  };

  const saveTrendSet = () => {
    try {
      const parsed = JSON.parse(importText);
      const normalized = normalizeImportedOptions(parsed);
      const name = trendSetName.trim() || `Trend Set ${new Date().toLocaleString("ja-JP")}`;
      const hasAny = Object.values(normalized).some((arr) => Array.isArray(arr) && arr.length > 0);
      if (!hasAny) {
        setImportStatus("error");
        return;
      }
      const entry = {
        id: createId(),
        name,
        createdAt: new Date().toLocaleString("ja-JP"),
        data: normalized,
        rawText: importText,
      };
      setSavedTrendSets((prev) => [entry, ...prev].slice(0, 20));
      setImportStatus("saved");
      window.setTimeout(() => setImportStatus("idle"), 1500);
    } catch {
      setImportStatus("error");
    }
  };

  const loadTrendSet = (setItem) => {
    setTrendSetName(setItem.name);
    setImportText(setItem.rawText || JSON.stringify(setItem.data, null, 2));
    setImportStatus("idle");
  };

  const applySavedTrendSet = (setItem) => {
    setImportedOptions((prev) => ({
      hair: [...prev.hair, ...(setItem.data?.hair || [])],
      makeup: [...prev.makeup, ...(setItem.data?.makeup || [])],
      wear: [...prev.wear, ...(setItem.data?.wear || [])],
      accessory: [...prev.accessory, ...(setItem.data?.accessory || [])],
      background: [...prev.background, ...(setItem.data?.background || [])],
      mood: [...prev.mood, ...(setItem.data?.mood || [])],
    }));
    setImportStatus("success");
    window.setTimeout(() => setImportStatus("idle"), 1500);
  };

  const deleteTrendSet = (id) => {
    setSavedTrendSets((prev) => prev.filter((item) => item.id !== id));
  };

  const saveEntry = (entry) => setHistory((prev) => [entry, ...prev].slice(0, 20));

  const generatePrompt = () => {
    const prompt = (() => {
      const picked = {};
      for (const key of GROUP_ORDER) {
        const item = mergedOptionGroups[key].options.find((o) => o.id === selection[key]);
        if (item) picked[key] = item;
      }
      const parts = [
        "A naturally beautiful woman portrayed with refined realism and emotional subtlety.",
        picked.season ? `Set in ${picked.season.en},` : "",
        picked.hair?.en,
        picked.makeup?.en,
        picked.wear?.en,
        picked.accessory?.en,
        picked.pose?.en,
        picked.background?.en,
        picked.mood?.en,
        picked.lighting?.en,
        "highly detailed, elegant composition, realistic texture, graceful atmosphere, cinematic fashion photography",
      ].filter(Boolean);
      const videoHint = VIDEO_HINTS[picked.pose?.id] || VIDEO_HINTS.default;
      return `${parts.join(", ")}.

--video_hint: ${videoHint}`;
    })();
    setOutput(prompt);
    setCopyState("idle");
    saveEntry({ id: createId(), createdAt: new Date().toLocaleString("ja-JP"), selection, prompt });
  };

  const randomizeAll = () => {
    const next = randomCompatibleSelection();
    const prompt = buildPrompt(next);
    setSelection(next);
    setOutput(prompt);
    setCopyState("idle");
    saveEntry({ id: createId(), createdAt: new Date().toLocaleString("ja-JP"), selection: next, prompt });
  };

  const resetAll = () => {
    setSelection({});
    setOutput("");
    setCopyState("idle");
    setManualCopyText("");
  };

  const handleCopy = async (text) => {
    const result = await copyTextToClipboard(text);
    if (result.ok) {
      setCopyState("copied");
      setManualCopyText("");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } else if (result.method === "manual") {
      setCopyState("manual");
      setManualCopyText(text);
    } else {
      setCopyState("error");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">詩的プロンプト生成UI</CardTitle>
            <CardDescription>3項目以上選ぶと生成できます。季節に応じてウェアや背景の整合も取ります。</CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">選択数 {selectedCount}</Badge>
              <Badge variant="secondary">動画ヒント自動付与</Badge>
              <Badge variant="secondary">履歴保存</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <section className="space-y-3 rounded-2xl bg-zinc-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold">トレンド候補インポート</h3>
                  <p className="text-sm text-zinc-600">ChatGPTで作ったJSONを貼り付けて、選択肢に追加します。</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge>固定 + 追加候補</Badge>
                  <Badge>保存されます</Badge>
                </div>
              </div>
              <Input value={trendSetName} onChange={(e) => setTrendSetName(e.target.value)} placeholder="保存名 例：2026年5月初め 東京トレンド" />
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                className="min-h-[220px] w-full rounded-2xl border border-zinc-200 bg-white p-3 text-xs leading-6 text-zinc-800"
              />
              <div className="flex flex-wrap gap-3">
                <Button onClick={importTrendOptions} className="rounded-2xl"><Upload className="mr-2 inline h-4 w-4" />追加する</Button>
                <Button onClick={saveTrendSet} className="rounded-2xl"><Save className="mr-2 inline h-4 w-4" />保存する</Button>
                <Button onClick={clearImportedOptions} className="rounded-2xl">追加候補を全消去</Button>
              </div>
              {importStatus === "success" ? <div className="text-sm text-zinc-600">追加しました。</div> : null}
              {importStatus === "saved" ? <div className="text-sm text-zinc-600">保存しました。</div> : null}
              {importStatus === "error" ? <div className="text-sm text-red-600">JSON形式を確認してください。</div> : null}
              <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="text-sm font-medium">保存済みトレンド</div>
                {savedTrendSets.length === 0 ? <div className="text-sm text-zinc-500">まだ保存はありません。</div> : savedTrendSets.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-zinc-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-zinc-500">{item.createdAt}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => loadTrendSet(item)} className="rounded-xl">読み込む</Button>
                        <Button onClick={() => applySavedTrendSet(item)} className="rounded-xl">追加</Button>
                        <Button onClick={() => deleteTrendSet(item.id)} className="rounded-xl"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {GROUP_ORDER.map((groupKey) => {
              const group = mergedOptionGroups[groupKey];
              const options = group.options.filter((opt) => !opt.seasons || !selectedSeason || opt.seasons.includes(selectedSeason));
              return (
                <section key={groupKey} className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold">{group.label}</h3>
                    {selection[groupKey] ? <Badge>{group.options.find((o) => o.id === selection[groupKey])?.label}</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {options.map((opt) => (
                      <div key={opt.id} className="flex items-center gap-1">
                        <SelectionChip active={selection[groupKey] === opt.id} onClick={() => toggleSelection(groupKey, opt.id)}>
                          {opt.label}
                        </SelectionChip>
                        {opt.imported ? <Badge>Trend</Badge> : null}
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
            <div className="flex flex-wrap gap-3 pt-2">
              <Button onClick={generatePrompt} disabled={!canGenerate} className="rounded-2xl">
                <Sparkles className="mr-2 h-4 w-4" />✨ プロンプトを生成
              </Button>
              <Button onClick={randomizeAll} variant="secondary" className="rounded-2xl">
                <Dice5 className="mr-2 h-4 w-4" />🎲 ランダム
              </Button>
              <Button onClick={resetAll} variant="outline" className="rounded-2xl">
                <RotateCcw className="mr-2 h-4 w-4" />リセット
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="space-y-6">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>生成結果</CardTitle>
            <CardDescription>詩的な英語プロンプトと動画向けの動きヒントを表示します。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="min-h-[260px] rounded-2xl bg-zinc-100 p-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">
              {output || "ここにプロンプトが表示されます。まず3項目以上を選ぶか、ランダム生成を試してください。"}
            </div>
            <Button variant="outline" onClick={() => handleCopy(output)} disabled={!output} className="rounded-2xl">
              <Copy className="mr-2 h-4 w-4" />Copy
            </Button>
            <CopyStatus state={copyState} manualText={manualCopyText} />
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" />履歴</CardTitle>
            <CardDescription>過去の生成結果を再利用できます。ブラウザに保存されます。</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[360px] pr-2">
              <div className="space-y-4">
                {history.length === 0 ? <div className="text-sm text-zinc-500">まだ履歴はありません。</div> : history.map((item, index) => (
                  <div key={item.id} className="space-y-2 rounded-2xl bg-zinc-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-zinc-500">{item.createdAt}</div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleCopy(item.prompt)} className="rounded-xl">Copy</Button>
                        <Button variant="outline" size="sm" onClick={() => { setSelection(item.selection); setOutput(item.prompt); setCopyState("idle"); }} className="rounded-xl">再利用</Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {GROUP_ORDER.map((key) => {
                        const chosen = OPTION_GROUPS[key].options.find((o) => o.id === item.selection[key]);
                        return chosen ? <Badge key={key} variant="secondary">{OPTION_GROUPS[key].label}:{chosen.label}</Badge> : null;
                      })}
                    </div>
                    <div className="text-sm leading-6 text-zinc-700 line-clamp-4">{item.prompt}</div>
                    {index < history.length - 1 ? <Separator className="mt-2" /> : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

function TrendPromptApp() {
  const [keyword, setKeyword] = useState("2026年5月初め・東京のトレンドスタイル");
  const [count, setCount] = useState(3);
  const [cards, setCards] = useState([]);
  const [history, setHistory] = useState([]);
  const [isWorking, setIsWorking] = useState(false);
  const [copyState, setCopyState] = useState("idle");
  const [manualCopyText, setManualCopyText] = useState("");

  useEffect(() => {
    setHistory(safeStorageGet(STORAGE_KEYS.trendHistory, []));
  }, []);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.trendHistory, history);
  }, [history]);

  const generateFromKeyword = async () => {
    setIsWorking(true);
    const season = detectSeasonFromKeyword(keyword);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const generated = Array.from({ length: count }, (_, index) => buildTrendPrompt({ keyword, season, index }));
    setCards(generated);
    setCopyState("idle");
    setHistory((prev) => [
      { id: createId(), createdAt: new Date().toLocaleString("ja-JP"), keyword, count, season, cards: generated },
      ...prev,
    ].slice(0, 12));
    setIsWorking(false);
  };

  const handleCopy = async (text) => {
    const result = await copyTextToClipboard(text);
    if (result.ok) {
      setCopyState("copied");
      setManualCopyText("");
      window.setTimeout(() => setCopyState("idle"), 1200);
    } else if (result.method === "manual") {
      setCopyState("manual");
      setManualCopyText(text);
    } else {
      setCopyState("error");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">キーワード → トレンド検索 → プロンプト生成</CardTitle>
            <CardDescription>
              まずキーワードから季節感と方向性を読み取り、コーデ・情景・ライティングを組み合わせて量産します。
            </CardDescription>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">3〜5件生成</Badge>
              <Badge variant="secondary">Copy対応</Badge>
              <Badge variant="secondary">履歴保存</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <div className="text-sm font-medium">キーワード</div>
              <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="例：2026年5月初め・東京のトレンドスタイル" className="rounded-2xl" />
            </div>
            <div className="space-y-2">
              <div className="text-sm font-medium">件数</div>
              <div className="flex gap-2">
                {[3, 4, 5].map((n) => (
                  <SelectionChip key={n} active={count === n} onClick={() => setCount(n)}>{n}件</SelectionChip>
                ))}
              </div>
            </div>
            <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-6 text-zinc-700">
              <div className="font-medium text-zinc-900">動作メモ</div>
              <div>このCanvas版は、見た目と流れを確認できるプロトタイプです。</div>
              <div>リアルタイムWeb検索そのものは未接続で、現在はキーワードから整合的なトレンド候補を組み立てています。</div>
              <div>実運用では外部APIやサーバー関数をつなぐと、本当にWeb検索 → 要約 → 生成の2段階にできます。</div>
            </div>
            <Button onClick={generateFromKeyword} disabled={!keyword.trim() || isWorking} className="rounded-2xl">
              {isWorking ? <Search className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
              ✨ トレンド検索 → プロンプト生成
            </Button>
            <CopyStatus state={copyState} manualText={manualCopyText} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {cards.map((card, index) => (
            <Card key={`${card.title}-${index}`} className="rounded-3xl border-0 shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg">{card.title}</CardTitle>
                    <CardDescription>{card.insight}</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-2xl" onClick={() => handleCopy(card.prompt)}>
                    <Copy className="mr-2 h-4 w-4" />Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl bg-zinc-100 p-4 text-sm leading-7 text-zinc-800 whitespace-pre-wrap">{card.prompt}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <Card className="rounded-3xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="h-4 w-4" />履歴</CardTitle>
            <CardDescription>過去のキーワード生成を再利用できます。</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[780px] pr-2">
              <div className="space-y-4">
                {history.length === 0 ? <div className="text-sm text-zinc-500">まだ履歴はありません。</div> : history.map((item, idx) => (
                  <div key={item.id} className="space-y-3 rounded-2xl bg-zinc-50 p-3">
                    <div className="text-xs text-zinc-500">{item.createdAt}</div>
                    <div className="font-medium text-sm">{item.keyword}</div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">{item.count}件</Badge>
                      <Badge variant="secondary">{item.season}</Badge>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => {
                        setKeyword(item.keyword);
                        setCount(item.count);
                        setCards(item.cards);
                        setCopyState("idle");
                      }}
                    >
                      再利用
                    </Button>
                    {idx < history.length - 1 ? <Separator className="mt-2" /> : null}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default function PromptWorkspace() {
  const [activeTab, setActiveTab] = useState("manual");
  const [selfTestFailures, setSelfTestFailures] = useState([]);

  useEffect(() => {
    setActiveTab(safeStorageGet(STORAGE_KEYS.activeTab, "manual"));
    setSelfTestFailures(runSelfTests());
  }, []);

  useEffect(() => {
    safeStorageSet(STORAGE_KEYS.activeTab, activeTab);
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-zinc-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Prompt Workspace</h1>
            <p className="text-sm text-zinc-600">選択式プロンプト生成と、キーワード起点の量産生成を1つの画面で使えます。</p>
          </div>
          <SectionTabs activeTab={activeTab} setActiveTab={setActiveTab} />
          {selfTestFailures.length > 0 ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              内部チェックで問題が見つかりました: {selfTestFailures.join(" / ")}
            </div>
          ) : null}
        </div>
        {activeTab === "manual" ? <ManualPromptApp /> : <TrendPromptApp />}
      </div>
    </div>
  );
}
