import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createRoot } from "react-dom/client";
import {
  ShoppingBag, Settings, Sun, Moon, Undo2, Redo2, Trash2, Copy,
  RotateCw, ArrowUp, ArrowDown, Search, Lock, X, Layers as LayersIcon,
  Save, Download, Sparkles, ChevronLeft, ChevronRight, Plus, Check,
  Eye, EyeOff, Trash, Volume2, VolumeX, ArrowRight, LogOut
} from "lucide-react";

/* ============================================================
   TOKENS
   ============================================================ */
const THEME = {
  dark: {
    bg: "#0F0B1F",
    bg2: "#161029",
    panel: "rgba(255,255,255,0.045)",
    panelSolid: "#1B1533",
    border: "rgba(255,255,255,0.09)",
    text: "#F5F3FF",
    muted: "#A79BC7",
    faint: "#6E6390",
  },
  light: {
    bg: "#F6F3FF",
    bg2: "#EFEAFB",
    panel: "rgba(20,10,40,0.035)",
    panelSolid: "#FFFFFF",
    border: "rgba(20,10,50,0.08)",
    text: "#1B1533",
    muted: "#6E6390",
    faint: "#9C8FC0",
  },
};
const ACCENTS = {
  coral: "#FF4F79",
  lime: "#B6FF3C",
  cyan: "#35E8D0",
  amber: "#FFC93C",
};
const FONTS_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

* { box-sizing: border-box; }
::selection { background: ${ACCENTS.coral}55; }
::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 8px; }

@keyframes stepFadeIn { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
.step-anim { animation: stepFadeIn .5s cubic-bezier(.16,1,.3,1) both; }

@keyframes floatY { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
.float-slow { animation: floatY 6s ease-in-out infinite; }

@keyframes heroGlowPulse { 0%,100% { opacity: .55; transform: scale(1); } 50% { opacity: .85; transform: scale(1.06); } }
.hero-glow { animation: heroGlowPulse 5s ease-in-out infinite; }

@keyframes logoSheen { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
.logo-sheen { background-size: 200% auto; animation: logoSheen 6s linear infinite; }

@keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fadeUp .6s cubic-bezier(.16,1,.3,1) both; }

.picker-card { transition: transform .28s cubic-bezier(.16,1,.3,1), box-shadow .28s ease, border-color .2s ease; }
.picker-card:hover { transform: translateY(-4px) scale(1.015); box-shadow: 0 16px 40px -14px rgba(0,0,0,0.45); }
.picker-card:active { transform: translateY(-1px) scale(0.995); }

.btn-primary-x { transition: transform .18s ease, box-shadow .18s ease, filter .18s ease; }
.btn-primary-x:hover { transform: translateY(-2px); box-shadow: 0 10px 26px -10px ${ACCENTS.coral}77; filter: brightness(1.05); }
.btn-primary-x:active { transform: translateY(0); }

.btn-ghost-x { transition: transform .18s ease, border-color .18s ease, background .18s ease; }
.btn-ghost-x:hover { border-color: ${ACCENTS.cyan}99; background: ${ACCENTS.cyan}0f; }

.icon-btn-x { transition: transform .18s ease, border-color .18s ease, background .18s ease; }
.icon-btn-x:hover { transform: translateY(-2px); border-color: ${ACCENTS.coral}88; }

.hero-cta { transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s ease; }
.hero-cta:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 18px 44px -12px ${ACCENTS.coral}88; }

@media (prefers-reduced-motion: reduce) {
  .step-anim, .float-slow, .hero-glow, .logo-sheen, .fade-up, .picker-card, .btn-primary-x, .btn-ghost-x, .icon-btn-x, .hero-cta { animation: none !important; transition: none !important; }
}
`;

/* ============================================================
   SAMPLE DATA GENERATORS
   ============================================================ */
const MODEL_COLORS = [
  "#8E8E93", "#F0EDE4", "#0B0B0F", "#2C3E50", "#C97A5A",
  "#4A5568", "#D9C7A3", "#5B6EE1", "#0F1B0F", "#E8E2D6",
];

const RAW_MODELS = [
  ["iPhone X", "dual-diagonal"], ["iPhone XS", "dual-diagonal"], ["iPhone XS Max", "dual-diagonal"],
  ["iPhone XR", "single"], ["iPhone 11", "single"], ["iPhone 11 Pro", "triangle"], ["iPhone 11 Pro Max", "triangle"],
  ["iPhone 12 Mini", "dual-diagonal"], ["iPhone 12", "dual-diagonal"], ["iPhone 12 Pro", "triangle"], ["iPhone 12 Pro Max", "triangle"],
  ["iPhone 13 Mini", "dual-diagonal"], ["iPhone 13", "dual-diagonal"], ["iPhone 13 Pro", "triangle"], ["iPhone 13 Pro Max", "triangle"],
  ["iPhone 14", "dual-vertical"], ["iPhone 14 Plus", "dual-vertical"], ["iPhone 14 Pro", "triangle"], ["iPhone 14 Pro Max", "triangle"],
  ["iPhone 15", "dual-vertical"], ["iPhone 15 Plus", "dual-vertical"], ["iPhone 15 Pro", "triangle"], ["iPhone 15 Pro Max", "triangle"],
  ["iPhone 16", "dual-vertical"], ["iPhone 16 Plus", "dual-vertical"], ["iPhone 16 Pro", "triangle"], ["iPhone 16 Pro Max", "triangle"],
  ["iPhone 17", "dual-vertical"], ["iPhone 17 Air", "single"], ["iPhone 17 Pro", "triangle"], ["iPhone 17 Pro Max", "triangle"],
];

function buildDefaultModels() {
  return RAW_MODELS.map(([name, layout], i) => ({
    id: "m_" + i,
    name,
    color: MODEL_COLORS[i % MODEL_COLORS.length],
    cameraLayout: layout,
    backImage: "",
    width: 300,
    height: 612,
    order: i,
  }));
}

const SHAPES = ["case", "lens", "camcover", "strap", "charm", "sticker", "popgrip", "wallet", "stand", "ring", "gem"];

const DEFAULT_ACCESSORIES_RAW = [
  { name: "Aurora Case", cat: "Phone Cases", shape: "case", price: 34, color: ACCENTS.cyan, colorable: true, w: 300, h: 612, x: 0, y: 0, rot: 0, z: 1 },
  { name: "Sunset Case", cat: "Phone Cases", shape: "case", price: 34, color: ACCENTS.coral, colorable: true, w: 300, h: 612, x: 0, y: 0, rot: 0, z: 1 },
  { name: "Midnight Case", cat: "Phone Cases", shape: "case", price: 34, color: "#2A1F45", colorable: true, w: 300, h: 612, x: 0, y: 0, rot: 0, z: 1 },
  { name: "MagSafe Wallet", cat: "MagSafe Accessories", shape: "wallet", price: 45, color: "#3B2A1D", colorable: true, w: 120, h: 90, x: 90, y: 340, rot: 0, z: 4 },
  { name: "Lens Guard Ring", cat: "Camera Lens Protectors", shape: "lens", price: 15, color: ACCENTS.amber, colorable: false, w: 110, h: 110, x: 95, y: 40, rot: 0, z: 5 },
  { name: "Camera Bump Cover", cat: "Camera Covers", shape: "camcover", price: 12, color: "#111111", colorable: true, w: 120, h: 120, x: 90, y: 35, rot: 0, z: 5 },
  { name: "Cross-Body Strap", cat: "Phone Straps", shape: "strap", price: 22, color: ACCENTS.lime, colorable: true, w: 260, h: 40, x: 20, y: 480, rot: -8, z: 6 },
  { name: "Star Charm", cat: "Phone Charms", shape: "charm", price: 9, color: ACCENTS.amber, colorable: true, w: 46, h: 70, x: 240, y: 470, rot: 12, z: 7 },
  { name: "Heart Charm", cat: "Phone Charms", shape: "charm2", price: 9, color: ACCENTS.coral, colorable: true, w: 42, h: 60, x: 230, y: 500, rot: -10, z: 7 },
  { name: "Flame Sticker", cat: "Phone Stickers", shape: "sticker", price: 5, color: ACCENTS.coral, colorable: true, w: 60, h: 60, x: 40, y: 200, rot: 0, z: 8 },
  { name: "Wave Sticker", cat: "Phone Stickers", shape: "sticker2", price: 5, color: ACCENTS.cyan, colorable: true, w: 64, h: 44, x: 190, y: 260, rot: -6, z: 8 },
  { name: "Grip Pop", cat: "Pop Grips", shape: "popgrip", price: 14, color: ACCENTS.lime, colorable: true, w: 70, h: 70, x: 115, y: 380, rot: 0, z: 9 },
  { name: "Card Holder", cat: "Wallet Attachments", shape: "wallet2", price: 19, color: "#4A3826", colorable: true, w: 100, h: 70, x: 100, y: 250, rot: 0, z: 4 },
  { name: "Fold Stand", cat: "Phone Stands", shape: "stand", price: 16, color: "#2D2440", colorable: true, w: 90, h: 60, x: 105, y: 520, rot: 0, z: 3 },
  { name: "Ring Holder", cat: "Ring Holders", shape: "ring", price: 11, color: ACCENTS.amber, colorable: true, w: 60, h: 60, x: 120, y: 400, rot: 0, z: 9 },
  { name: "Crystal Gem", cat: "Decorative Accessories", shape: "gem", price: 7, color: ACCENTS.cyan, colorable: true, w: 34, h: 34, x: 60, y: 320, rot: 20, z: 8 },
];

function buildDefaultAccessories() {
  return DEFAULT_ACCESSORIES_RAW.map((a, i) => ({
    id: "a_" + i,
    name: a.name,
    category: a.cat,
    shape: a.shape,
    price: a.price,
    color: a.color,
    colorable: a.colorable,
    imageUrl: "",
    transparentImageUrl: "",
    compatibleModels: "all",
    defaultX: a.x, defaultY: a.y, defaultW: a.w, defaultH: a.h, defaultRot: a.rot, defaultZ: a.z,
    enabled: true,
  }));
}

const CATEGORIES = [
  "Phone Cases", "MagSafe Accessories", "Camera Lens Protectors", "Camera Covers",
  "Phone Straps", "Phone Charms", "Phone Stickers", "Pop Grips", "Wallet Attachments",
  "Phone Stands", "Ring Holders", "Decorative Accessories", "Custom Accessories",
];

const STORAGE_KEY = "iphone_custom_studio_v1";

/* ============================================================
   SMALL HELPERS
   ============================================================ */
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}
function persist(partial) {
  try {
    const cur = loadState() || {};
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...cur, ...partial }));
  } catch (e) {}
}
function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

/* Web Audio tiny SFX (no external files) */
function useSFX(enabled) {
  const ctxRef = useRef(null);
  const play = useCallback((type) => {
    if (!enabled) return;
    try {
      if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ctx = ctxRef.current;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      const now = ctx.currentTime;
      let freq = 440, dur = 0.08;
      if (type === "click") { freq = 520; dur = 0.06; }
      if (type === "add") { freq = 700; dur = 0.12; }
      if (type === "snap") { freq = 900; dur = 0.05; }
      if (type === "success") { freq = 660; dur = 0.25; }
      o.type = "sine";
      o.frequency.setValueAtTime(freq, now);
      if (type === "success") o.frequency.exponentialRampToValueAtTime(freq * 1.6, now + dur);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      o.start(now); o.stop(now + dur + 0.02);
    } catch (e) {}
  }, [enabled]);
  return play;
}

/* ============================================================
   SVG VISUALS — Phone + Accessories (procedural, replaceable via Admin URLs)
   ============================================================ */
function PhoneSVG({ model }) {
  const w = 220, h = 448, r = 46;
  const cam = model.cameraLayout;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <linearGradient id="phoneSheen" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="35%" stopColor="#ffffff" stopOpacity="0.02" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width={w - 4} height={h - 4} rx={r} fill={model.color} stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" />
      <rect x="2" y="2" width={w - 4} height={h - 4} rx={r} fill="url(#phoneSheen)" />
      {/* camera bump */}
      <g transform={`translate(${w - 92}, 26)`}>
        <rect x="0" y="0" width="66" height="66" rx="18" fill="rgba(0,0,0,0.28)" />
        {cam === "single" && <circle cx="33" cy="33" r="15" fill="#0a0a0c" stroke="#333" strokeWidth="2" />}
        {cam === "dual-diagonal" && (
          <>
            <circle cx="22" cy="22" r="12" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
            <circle cx="44" cy="44" r="12" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
          </>
        )}
        {cam === "dual-vertical" && (
          <>
            <circle cx="33" cy="20" r="12" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
            <circle cx="33" cy="46" r="12" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
          </>
        )}
        {cam === "triangle" && (
          <>
            <circle cx="20" cy="20" r="11" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
            <circle cx="46" cy="20" r="11" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
            <circle cx="33" cy="46" r="11" fill="#0a0a0c" stroke="#333" strokeWidth="2" />
            <circle cx="33" cy="33" r="4" fill="#050505" />
          </>
        )}
      </g>
      <text x={w / 2} y={h - 14} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.5)" fontFamily="Inter, sans-serif" letterSpacing="1.5">
        {model.name.toUpperCase()}
      </text>
    </svg>
  );
}

function AccessorySVG({ shape, color }) {
  const common = { width: "100%", height: "100%", style: { display: "block", overflow: "visible" } };
  switch (shape) {
    case "case":
      return (
        <svg viewBox="0 0 220 448" {...common}>
          <rect x="4" y="4" width="212" height="440" rx="48" fill="none" stroke={color} strokeWidth="14" strokeOpacity="0.92" />
          <rect x="4" y="4" width="212" height="440" rx="48" fill={color} fillOpacity="0.06" />
        </svg>
      );
    case "lens":
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <circle cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" />
        </svg>
      );
    case "camcover":
      return (
        <svg viewBox="0 0 100 100" {...common}>
          <rect x="6" y="6" width="88" height="88" rx="22" fill={color} fillOpacity="0.85" />
          <circle cx="34" cy="34" r="12" fill="#00000055" />
          <circle cx="66" cy="34" r="12" fill="#00000055" />
          <circle cx="50" cy="62" r="12" fill="#00000055" />
        </svg>
      );
    case "strap":
      return (
        <svg viewBox="0 0 260 40" {...common}>
          <rect x="0" y="10" width="260" height="20" rx="10" fill={color} />
          <rect x="0" y="10" width="260" height="6" rx="3" fill="#ffffff" fillOpacity="0.25" />
        </svg>
      );
    case "charm":
      return (
        <svg viewBox="0 0 46 70" {...common}>
          <line x1="23" y1="0" x2="23" y2="18" stroke="#999" strokeWidth="2" />
          <path d="M23 20 L34 42 L23 68 L12 42 Z" fill={color} />
        </svg>
      );
    case "charm2":
      return (
        <svg viewBox="0 0 42 60" {...common}>
          <line x1="21" y1="0" x2="21" y2="16" stroke="#999" strokeWidth="2" />
          <path d="M21 44 C6 30 2 16 12 12 C18 10 21 16 21 20 C21 16 24 10 30 12 C40 16 36 30 21 44 Z" fill={color} />
        </svg>
      );
    case "sticker":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <path d="M30 4 L37 22 L56 22 L41 34 L47 53 L30 41 L13 53 L19 34 L4 22 L23 22 Z" fill={color} />
        </svg>
      );
    case "sticker2":
      return (
        <svg viewBox="0 0 64 44" {...common}>
          <path d="M2 30 Q16 6 32 22 T62 14" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" />
        </svg>
      );
    case "popgrip":
      return (
        <svg viewBox="0 0 70 70" {...common}>
          <circle cx="35" cy="35" r="32" fill={color} />
          <circle cx="35" cy="35" r="10" fill="#000" fillOpacity="0.25" />
        </svg>
      );
    case "wallet":
    case "wallet2":
      return (
        <svg viewBox="0 0 120 90" {...common}>
          <rect x="4" y="4" width="112" height="82" rx="12" fill={color} />
          <rect x="14" y="18" width="60" height="10" rx="3" fill="#ffffff" fillOpacity="0.35" />
          <rect x="14" y="34" width="90" height="6" rx="3" fill="#ffffff" fillOpacity="0.2" />
        </svg>
      );
    case "stand":
      return (
        <svg viewBox="0 0 90 60" {...common}>
          <path d="M6 54 L20 10 L70 10 L84 54 Z" fill="none" stroke={color} strokeWidth="8" strokeLinejoin="round" />
        </svg>
      );
    case "ring":
      return (
        <svg viewBox="0 0 60 60" {...common}>
          <circle cx="30" cy="30" r="24" fill="none" stroke={color} strokeWidth="9" />
          <circle cx="30" cy="30" r="7" fill={color} />
        </svg>
      );
    case "gem":
      return (
        <svg viewBox="0 0 34 34" {...common}>
          <polygon points="17,2 30,13 24,32 10,32 4,13" fill={color} />
        </svg>
      );
    default:
      return <svg viewBox="0 0 50 50" {...common}><rect width="50" height="50" rx="8" fill={color} /></svg>;
  }
}

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const saved = useMemo(() => loadState(), []);
  const [dark, setDark] = useState(saved?.dark ?? true);
  const [soundOn, setSoundOn] = useState(saved?.soundOn ?? true);
  const play = useSFX(soundOn);
  const t = dark ? THEME.dark : THEME.light;

  const [models, setModels] = useState(saved?.models?.length ? saved.models : buildDefaultModels());
  const [accessories, setAccessories] = useState(saved?.accessories?.length ? saved.accessories : buildDefaultAccessories());

  const [step, setStep] = useState(0);
  const [selectedModelId, setSelectedModelId] = useState(saved?.selectedModelId || null);
  const [bag, setBag] = useState(saved?.bag || []); // array of accessory ids
  const [bagOpen, setBagOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("All");

  const [placed, setPlaced] = useState(saved?.placed || []); // {instanceId, accessoryId, x,y,w,h,rot,z,opacity,color}
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const [adminOpen, setAdminOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);
  const [adminPw, setAdminPw] = useState("");
  const [adminTab, setAdminTab] = useState("models");

  const [savedDesigns, setSavedDesigns] = useState(saved?.savedDesigns || []);
  const [showCelebrate, setShowCelebrate] = useState(false);
  const [snapGuide, setSnapGuide] = useState(null);

  const stageRef = useRef(null);
  const dragRef = useRef(null);

  // persist important bits
  useEffect(() => { persist({ dark, soundOn, models, accessories, selectedModelId, bag, placed, savedDesigns }); },
    [dark, soundOn, models, accessories, selectedModelId, bag, placed, savedDesigns]);

  const selectedModel = models.find(m => m.id === selectedModelId) || null;

  function commitHistory(nextPlaced) {
    const branch = history.slice(0, historyIdx + 1);
    const next = [...branch, nextPlaced];
    setHistory(next);
    setHistoryIdx(next.length - 1);
  }
  function updatePlaced(nextPlaced, { record = true } = {}) {
    setPlaced(nextPlaced);
    if (record) commitHistory(nextPlaced);
  }
  function undo() {
    if (historyIdx <= 0) return;
    const idx = historyIdx - 1;
    setHistoryIdx(idx);
    setPlaced(history[idx]);
  }
  function redo() {
    if (historyIdx >= history.length - 1) return;
    const idx = historyIdx + 1;
    setHistoryIdx(idx);
    setPlaced(history[idx]);
  }

  /* ---------- STEP 1: choose iPhone ---------- */
  const filteredModels = models.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  function chooseModel(id) {
    setSelectedModelId(id);
    play("click");
  }

  /* ---------- STEP 2: choose accessories ---------- */
  const activeAccessories = accessories.filter(a => a.enabled !== false);
  const visibleAccessories = activeAccessories.filter(a => {
    const matchCat = catFilter === "All" || a.category === catFilter;
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase());
    const matchModel = a.compatibleModels === "all" || !selectedModelId ||
      (Array.isArray(a.compatibleModels) && a.compatibleModels.includes(selectedModelId));
    return matchCat && matchSearch && matchModel;
  });

  function toggleBag(accId) {
    setBag(prev => {
      const has = prev.includes(accId);
      play(has ? "click" : "add");
      return has ? prev.filter(id => id !== accId) : [...prev, accId];
    });
  }

  function goToCustomize() {
    // seed placed items from bag if not already placed
    const existingIds = new Set(placed.map(p => p.accessoryId));
    const additions = bag.filter(id => !existingIds.has(id)).map(id => {
      const a = accessories.find(x => x.id === id);
      return {
        instanceId: uid("inst"),
        accessoryId: id,
        x: a.defaultX, y: a.defaultY, w: a.defaultW, h: a.defaultH,
        rot: a.defaultRot, z: a.defaultZ, opacity: 1, color: a.color,
      };
    });
    const removals = placed.filter(p => bag.includes(p.accessoryId));
    const next = [...removals, ...additions];
    updatePlaced(next);
    setStep(3);
  }

  /* ---------- STEP 3: customize ---------- */
  function getStageSize() {
    const el = stageRef.current;
    if (!el) return { w: 220, h: 448 };
    const rect = el.getBoundingClientRect();
    return { w: rect.width, h: rect.height, rect };
  }

  function onItemPointerDown(e, inst) {
    e.stopPropagation();
    setSelectedInstance(inst.instanceId);
    const { rect } = getStageSize();
    dragRef.current = {
      mode: "drag",
      instanceId: inst.instanceId,
      startClientX: e.clientX, startClientY: e.clientY,
      startX: inst.x, startY: inst.y,
      rect,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  function onResizeStart(e, inst) {
    e.stopPropagation();
    setSelectedInstance(inst.instanceId);
    const { rect } = getStageSize();
    dragRef.current = {
      mode: "resize",
      instanceId: inst.instanceId,
      startClientX: e.clientX, startClientY: e.clientY,
      startW: inst.w, startH: inst.h,
      rect,
    };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }
  function onRotateStart(e, inst) {
    e.stopPropagation();
    setSelectedInstance(inst.instanceId);
    const { rect } = getStageSize();
    const cx = rect.left + inst.x + inst.w / 2;
    const cy = rect.top + inst.y + inst.h / 2;
    dragRef.current = { mode: "rotate", instanceId: inst.instanceId, cx, cy, startRot: inst.rot, rect };
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  }

  function onPointerMove(e) {
    const d = dragRef.current;
    if (!d) return;
    setPlaced(prev => {
      const idx = prev.findIndex(p => p.instanceId === d.instanceId);
      if (idx === -1) return prev;
      const item = prev[idx];
      let next = { ...item };
      if (d.mode === "drag") {
        let nx = d.startX + (e.clientX - d.startClientX);
        let ny = d.startY + (e.clientY - d.startClientY);
        const stageW = d.rect.width, stageH = d.rect.height;
        const centerX = nx + item.w / 2;
        const snapThreshold = 8;
        let snapped = false;
        if (Math.abs(centerX - stageW / 2) < snapThreshold) {
          nx = stageW / 2 - item.w / 2;
          snapped = true;
        }
        setSnapGuide(snapped ? stageW / 2 : null);
        next.x = clamp(nx, -item.w * 0.4, stageW - item.w * 0.6);
        next.y = clamp(ny, -item.h * 0.4, stageH - item.h * 0.6);
      } else if (d.mode === "resize") {
        const dx = e.clientX - d.startClientX;
        const ratio = d.startH / d.startW;
        const w = clamp(d.startW + dx, 24, 500);
        next.w = w;
        next.h = w * ratio;
      } else if (d.mode === "rotate") {
        const angle = Math.atan2(e.clientY - d.cy, e.clientX - d.cx) * (180 / Math.PI) + 90;
        next.rot = Math.round(angle);
      }
      const copy = [...prev];
      copy[idx] = next;
      return copy;
    });
  }
  function onPointerUp() {
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", onPointerUp);
    if (dragRef.current) {
      dragRef.current = null;
      setSnapGuide(null);
      setPlaced(cur => { commitHistory(cur); return cur; });
      play("snap");
    }
  }

  function deleteInstance(instanceId) {
    updatePlaced(placed.filter(p => p.instanceId !== instanceId));
    setBag(prev => {
      const inst = placed.find(p => p.instanceId === instanceId);
      if (!inst) return prev;
      const stillPlaced = placed.some(p => p.accessoryId === inst.accessoryId && p.instanceId !== instanceId);
      return stillPlaced ? prev : prev.filter(id => id !== inst.accessoryId);
    });
    setSelectedInstance(null);
    play("click");
  }
  function duplicateInstance(instanceId) {
    const item = placed.find(p => p.instanceId === instanceId);
    if (!item) return;
    const copy = { ...item, instanceId: uid("inst"), x: item.x + 16, y: item.y + 16, z: (maxZ() + 1) };
    updatePlaced([...placed, copy]);
    setSelectedInstance(copy.instanceId);
    play("add");
  }
  function maxZ() { return placed.reduce((m, p) => Math.max(m, p.z), 0); }
  function bringToFront(instanceId) {
    const z = maxZ() + 1;
    updatePlaced(placed.map(p => p.instanceId === instanceId ? { ...p, z } : p));
  }
  function sendToBack(instanceId) {
    const minZ = placed.reduce((m, p) => Math.min(m, p.z), 0);
    updatePlaced(placed.map(p => p.instanceId === instanceId ? { ...p, z: minZ - 1 } : p));
  }
  function reorderLayer(instanceId, dir) {
    const sorted = [...placed].sort((a, b) => a.z - b.z);
    const idx = sorted.findIndex(p => p.instanceId === instanceId);
    const swapIdx = dir === "up" ? idx + 1 : idx - 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const zA = sorted[idx].z, zB = sorted[swapIdx].z;
    updatePlaced(placed.map(p => {
      if (p.instanceId === sorted[idx].instanceId) return { ...p, z: zB };
      if (p.instanceId === sorted[swapIdx].instanceId) return { ...p, z: zA };
      return p;
    }));
  }
  function setInstanceColor(instanceId, color) {
    updatePlaced(placed.map(p => p.instanceId === instanceId ? { ...p, color } : p));
  }
  function setInstanceOpacity(instanceId, opacity) {
    setPlaced(prev => prev.map(p => p.instanceId === instanceId ? { ...p, opacity } : p));
  }
  function resetDesign() {
    updatePlaced([]);
    setBag([]);
    setSelectedInstance(null);
    play("click");
  }

  const styleScore = useMemo(() => {
    if (placed.length === 0) return 0;
    const cats = new Set(placed.map(p => {
      const a = accessories.find(x => x.id === p.accessoryId);
      return a?.category;
    }));
    let score = 40 + placed.length * 6 + cats.size * 8;
    return clamp(Math.round(score), 0, 99);
  }, [placed, accessories]);

  const scoreMessage = styleScore >= 90 ? "Perfect Match!" : styleScore >= 70 ? "Great Combination!" : styleScore >= 40 ? "Looking Good!" : "Add a few more touches";

  function goToPreview() {
    setStep(4);
    if (styleScore >= 70) {
      setShowCelebrate(true);
      play("success");
      setTimeout(() => setShowCelebrate(false), 1600);
    }
  }

  function saveDesign() {
    const design = {
      id: uid("design"),
      name: `${selectedModel?.name || "Custom"} — ${new Date().toLocaleDateString()}`,
      modelId: selectedModelId,
      placed,
      total: subtotal,
      createdAt: Date.now(),
    };
    setSavedDesigns(prev => [design, ...prev].slice(0, 20));
    play("success");
  }

  const bagAccessories = bag.map(id => accessories.find(a => a.id === id)).filter(Boolean);
  const subtotal = bagAccessories.reduce((s, a) => s + a.price, 0);

  /* ---------- ADMIN ---------- */
  function addModel(m) { setModels(prev => [...prev, { ...m, id: uid("m"), order: prev.length }]); }
  function updateModel(id, patch) { setModels(prev => prev.map(m => m.id === id ? { ...m, ...patch } : m)); }
  function deleteModel(id) { setModels(prev => prev.filter(m => m.id !== id)); }

  function addAccessory(a) { setAccessories(prev => [...prev, { ...a, id: uid("a") }]); }
  function updateAccessory(id, patch) { setAccessories(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a)); }
  function deleteAccessory(id) { setAccessories(prev => prev.filter(a => a.id !== id)); }

  /* ============================================================
     STYLES
     ============================================================ */
  const S = {
    root: {
      background: `radial-gradient(1200px 800px at 15% -10%, ${t.bg2}, ${t.bg} 55%)`,
      color: t.text, minHeight: "100%", fontFamily: "'Inter', sans-serif",
      display: "flex", flexDirection: "column",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "14px 22px", borderBottom: `1px solid ${t.border}`,
      position: "sticky", top: 0, zIndex: 40, backdropFilter: "blur(14px)",
      background: dark ? "rgba(15,11,31,0.7)" : "rgba(246,243,255,0.75)",
    },
    logo: {
      fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 18,
      background: `linear-gradient(90deg, ${ACCENTS.coral}, ${ACCENTS.amber} 30%, ${ACCENTS.cyan} 60%, ${ACCENTS.coral})`,
      WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", letterSpacing: -0.3,
      cursor: "pointer",
    },
    iconBtn: (active) => ({
      display: "flex", alignItems: "center", justifyContent: "center",
      width: 38, height: 38, borderRadius: 12, border: `1px solid ${t.border}`,
      background: active ? ACCENTS.coral : t.panel, color: active ? "#1a0812" : t.text,
      cursor: "pointer",
    }),
    steps: { display: "flex", gap: 4, alignItems: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11 },
    stepDot: (activeStep, n) => ({
      display: "flex", alignItems: "center", gap: 6,
      color: n === activeStep ? t.text : n < activeStep ? ACCENTS.lime : t.faint,
      opacity: n <= activeStep || n < activeStep ? 1 : 0.5,
    }),
    main: { flex: 1, padding: "22px", maxWidth: 1180, margin: "0 auto", width: "100%" },
    card: {
      background: t.panel, border: `1px solid ${t.border}`, borderRadius: 18, padding: 16,
      backdropFilter: "blur(10px)",
    },
    grid: { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px,1fr))", gap: 14 },
    input: {
      background: t.panelSolid, border: `1px solid ${t.border}`, borderRadius: 10,
      padding: "9px 12px", color: t.text, fontSize: 13, outline: "none", width: "100%",
      fontFamily: "'Inter', sans-serif",
    },
    btnPrimary: {
      display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 20px", borderRadius: 999,
      background: `linear-gradient(90deg, ${ACCENTS.coral}, ${ACCENTS.amber})`,
      color: "#1a0812", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer",
      fontFamily: "'Space Grotesk', sans-serif",
    },
    btnGhost: {
      display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 18px", borderRadius: 999,
      background: "transparent", color: t.text, fontWeight: 600, fontSize: 13,
      border: `1px solid ${t.border}`, cursor: "pointer",
    },
  };

  const STEP_LABELS = ["", "Choose iPhone", "Choose Accessories", "Customize", "Preview"];

  return (
    <div style={S.root}>
      <style>{FONTS_CSS}</style>

      {/* HEADER */}
      <div style={S.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div className="logo-sheen" style={S.logo} onClick={() => setStep(0)}>iPhone Custom Studio</div>
          <div style={{ ...S.steps, display: (step === 0 || window.innerWidth < 760) ? "none" : "flex" }}>
            {[1, 2, 3, 4].map(n => (
              <div key={n} style={{ display: "flex", alignItems: "center" }}>
                <div style={S.stepDot(step, n)}>
                  <span style={{
                    width: 18, height: 18, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
                    border: `1px solid ${n === step ? ACCENTS.coral : t.border}`,
                    background: n < step ? ACCENTS.lime : "transparent",
                    color: n < step ? "#132000" : "inherit", fontSize: 10,
                  }}>{n < step ? <Check size={11} /> : n}</span>
                  <span>{STEP_LABELS[n]}</span>
                </div>
                {n < 4 && <div style={{ width: 20, height: 1, background: t.border, margin: "0 8px" }} />}
              </div>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="icon-btn-x" style={S.iconBtn(false)} onClick={() => setSoundOn(s => !s)} title="Toggle sound">
            {soundOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button className="icon-btn-x" style={S.iconBtn(false)} onClick={() => setDark(d => !d)} title="Toggle theme">
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="icon-btn-x" style={S.iconBtn(false)} onClick={() => setAdminOpen(true)} title="Admin settings">
            <Settings size={16} />
          </button>
          <button className="icon-btn-x" style={{ ...S.iconBtn(bagOpen), position: "relative", width: "auto", padding: "0 12px", gap: 6 }} onClick={() => setBagOpen(true)}>
            <ShoppingBag size={16} /> <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{bag.length}</span>
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={S.main}>
        <div key={step} className="step-anim">
        {step === 0 && <Hero t={t} dark={dark} models={models} onStart={() => { setStep(1); play("click"); }} />}
        {step === 1 && (
          <StepChooseModel
            S={S} t={t} models={filteredModels} selectedModelId={selectedModelId}
            onChoose={chooseModel} search={search} setSearch={setSearch}
          />
        )}
        {step === 2 && (
          <StepAccessories
            S={S} t={t} accessories={visibleAccessories} bag={bag} toggleBag={toggleBag}
            search={search} setSearch={setSearch} catFilter={catFilter} setCatFilter={setCatFilter}
            selectedModel={selectedModel}
          />
        )}
        {step === 3 && (
          <StepCustomize
            S={S} t={t} stageRef={stageRef} selectedModel={selectedModel} placed={placed}
            accessories={accessories} selectedInstance={selectedInstance} setSelectedInstance={setSelectedInstance}
            onItemPointerDown={onItemPointerDown} onResizeStart={onResizeStart} onRotateStart={onRotateStart}
            deleteInstance={deleteInstance} duplicateInstance={duplicateInstance}
            bringToFront={bringToFront} sendToBack={sendToBack} reorderLayer={reorderLayer}
            setInstanceColor={setInstanceColor} setInstanceOpacity={setInstanceOpacity}
            undo={undo} redo={redo} canUndo={historyIdx > 0} canRedo={historyIdx < history.length - 1}
            resetDesign={resetDesign} snapGuide={snapGuide} styleScore={styleScore} scoreMessage={scoreMessage}
            dark={dark}
          />
        )}
        {step === 4 && (
          <StepPreview
            S={S} t={t} selectedModel={selectedModel} placed={placed} accessories={accessories}
            subtotal={subtotal + placed.reduce((s, p) => { const a = accessories.find(x => x.id === p.accessoryId); return s + (a ? 0 : 0); }, 0)}
            bagAccessories={bagAccessories} saveDesign={saveDesign} setStep={setStep}
            showCelebrate={showCelebrate}
          />
        )}
        </div>
      </div>

      {/* FOOTER NAV */}
      {step !== 0 && (
      <div style={{
        position: "sticky", bottom: 0, borderTop: `1px solid ${t.border}`, padding: "14px 22px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: dark ? "rgba(15,11,31,0.85)" : "rgba(246,243,255,0.9)", backdropFilter: "blur(14px)",
      }}>
        <button className="btn-ghost-x" style={S.btnGhost} onClick={() => setStep(s => Math.max(0, s - 1))}>
          <ChevronLeft size={16} /> Back
        </button>
        {step === 1 && (
          <button className="btn-primary-x" style={S.btnPrimary} disabled={!selectedModelId} onClick={() => { setStep(2); play("click"); }}>
            Next — Choose Accessories <ArrowRight size={16} />
          </button>
        )}
        {step === 2 && (
          <button className="btn-primary-x" style={S.btnPrimary} onClick={goToCustomize}>
            Continue — Customize <ArrowRight size={16} />
          </button>
        )}
        {step === 3 && (
          <button className="btn-primary-x" style={S.btnPrimary} onClick={goToPreview}>
            Finish — Preview <ArrowRight size={16} />
          </button>
        )}
        {step === 4 && (
          <button className="btn-primary-x" style={S.btnPrimary} onClick={() => { setStep(1); }}>
            Start a New Design <Sparkles size={16} />
          </button>
        )}
      </div>
      )}

      {/* BAG DRAWER */}
      {bagOpen && (
        <Drawer onClose={() => setBagOpen(false)} title="Your Bag" t={t} dark={dark}>
          {bagAccessories.length === 0 && <p style={{ color: t.muted, fontSize: 13 }}>No accessories yet — pick some in Step 2.</p>}
          {bagAccessories.map(a => (
            <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: `1px solid ${t.border}` }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.panelSolid, padding: 6 }}>
                <AccessorySVG shape={a.shape} color={a.color} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{a.name}</div>
                <div style={{ fontSize: 11, color: t.muted }}>{a.category}</div>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${a.price}</div>
              <button onClick={() => toggleBag(a.id)} style={{ background: "none", border: "none", color: t.faint, cursor: "pointer" }}><X size={16} /></button>
            </div>
          ))}
          {bagAccessories.length > 0 && (
            <div style={{ marginTop: 14, display: "flex", justifyContent: "space-between", fontFamily: "'JetBrains Mono', monospace" }}>
              <span>Subtotal</span><span>${subtotal}</span>
            </div>
          )}
        </Drawer>
      )}

      {/* ADMIN */}
      {adminOpen && (
        <AdminPanel
          t={t} S={S} dark={dark}
          authed={adminAuthed} pw={adminPw} setPw={setAdminPw}
          onAuth={() => setAdminAuthed(adminPw === "admin123")}
          onClose={() => setAdminOpen(false)}
          tab={adminTab} setTab={setAdminTab}
          models={models} addModel={addModel} updateModel={updateModel} deleteModel={deleteModel}
          accessories={accessories} addAccessory={addAccessory} updateAccessory={updateAccessory} deleteAccessory={deleteAccessory}
          savedDesigns={savedDesigns}
        />
      )}
    </div>
  );
}

/* ============================================================
   HERO — landing screen
   ============================================================ */
function Hero({ t, dark, models, onStart }) {
  const showcase = models.slice(24, 28); // the 17 lineup
  return (
    <div style={{ padding: "6vh 0 4vh", textAlign: "center", position: "relative", overflow: "hidden" }}>
      <div className="hero-glow" style={{
        position: "absolute", top: "-10%", left: "50%", width: 620, height: 620, marginLeft: -310,
        background: `radial-gradient(circle, ${ACCENTS.coral}30, ${ACCENTS.cyan}18 45%, transparent 72%)`,
        filter: "blur(10px)", pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="fade-up" style={{
          display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 999,
          border: `1px solid ${t.border}`, background: t.panel, fontSize: 11.5, color: t.muted,
          fontFamily: "'JetBrains Mono', monospace", marginBottom: 22, letterSpacing: 0.5,
        }}>
          <Sparkles size={12} color={ACCENTS.amber} /> DESIGN YOUR OWN, IN REAL TIME
        </div>

        <h1 className="fade-up" style={{
          fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, letterSpacing: -1.5,
          fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 1.04, margin: "0 0 16px", animationDelay: ".05s",
        }}>
          Your iPhone.<br />
          <span style={{
            background: `linear-gradient(90deg, ${ACCENTS.coral}, ${ACCENTS.amber} 45%, ${ACCENTS.cyan})`,
            WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent",
          }}>Styled by you.</span>
        </h1>

        <p className="fade-up" style={{
          color: t.muted, fontSize: 16, maxWidth: 480, margin: "0 auto 34px", lineHeight: 1.55, animationDelay: ".1s",
        }}>
          Pick your exact model, drop on cases, charms, straps and grips, then drag,
          resize and recolor until it's unmistakably yours — all before you buy a thing.
        </p>

        <button className="hero-cta fade-up" onClick={onStart} style={{
          display: "inline-flex", alignItems: "center", gap: 10, padding: "16px 30px", borderRadius: 999,
          background: `linear-gradient(90deg, ${ACCENTS.coral}, ${ACCENTS.amber})`, color: "#1a0812",
          fontWeight: 700, fontSize: 15.5, border: "none", cursor: "pointer",
          fontFamily: "'Space Grotesk', sans-serif", boxShadow: `0 14px 34px -12px ${ACCENTS.coral}66`,
          animationDelay: ".16s",
        }}>
          Start Customizing <ArrowRight size={17} />
        </button>

        <div className="fade-up" style={{
          display: "flex", justifyContent: "center", gap: 28, marginTop: 20, fontSize: 11.5,
          color: t.faint, fontFamily: "'JetBrains Mono', monospace", animationDelay: ".2s",
        }}>
          <span>{models.length} MODELS</span>
          <span>·</span>
          <span>13 ACCESSORY CATEGORIES</span>
          <span>·</span>
          <span>REAL-TIME PREVIEW</span>
        </div>

        <div className="fade-up" style={{
          display: "flex", justifyContent: "center", gap: 18, marginTop: 56, flexWrap: "wrap", animationDelay: ".25s",
        }}>
          {showcase.map((m, i) => (
            <div key={m.id} className="float-slow" style={{
              width: 96, height: 194, animationDelay: `${i * 0.4}s`,
              filter: dark ? "drop-shadow(0 18px 30px rgba(0,0,0,0.5))" : "drop-shadow(0 18px 26px rgba(20,10,50,0.18))",
            }}>
              <PhoneSVG model={m} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   STEP 1
   ============================================================ */
function StepChooseModel({ S, t, models, selectedModelId, onChoose, search, setSearch }) {
  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, marginBottom: 4 }}>Choose your iPhone</h1>
      <p style={{ color: t.muted, fontSize: 13, marginBottom: 18 }}>Pick your exact model — every camera layout is fitted precisely.</p>
      <div style={{ position: "relative", marginBottom: 18, maxWidth: 340 }}>
        <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: t.faint }} />
        <input style={{ ...S.input, paddingLeft: 34 }} placeholder="Search models…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div style={S.grid}>
        {models.map(m => (
          <div key={m.id} className="picker-card" onClick={() => onChoose(m.id)} style={{
            ...S.card, cursor: "pointer", textAlign: "center", padding: 14,
            border: `1px solid ${m.id === selectedModelId ? ACCENTS.coral : t.border}`,
            boxShadow: m.id === selectedModelId ? `0 0 0 3px ${ACCENTS.coral}22` : "none",
            transition: "transform .15s ease", transform: m.id === selectedModelId ? "translateY(-2px)" : "none",
          }}>
            <div style={{ height: 110, marginBottom: 8 }}><PhoneSVG model={m} /></div>
            <div style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============================================================
   STEP 2
   ============================================================ */
function StepAccessories({ S, t, accessories, bag, toggleBag, search, setSearch, catFilter, setCatFilter, selectedModel }) {
  const cats = ["All", ...CATEGORIES];
  return (
    <div>
      <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, marginBottom: 4 }}>Choose accessories</h1>
      <p style={{ color: t.muted, fontSize: 13, marginBottom: 16 }}>
        Building for <strong style={{ color: t.text }}>{selectedModel?.name || "your iPhone"}</strong>. Add anything you like — you'll style it next.
      </p>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", width: 240 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: 11, color: t.faint }} />
          <input style={{ ...S.input, paddingLeft: 34 }} placeholder="Search accessories…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              padding: "6px 12px", borderRadius: 999, fontSize: 11, cursor: "pointer",
              border: `1px solid ${c === catFilter ? ACCENTS.cyan : t.border}`,
              background: c === catFilter ? `${ACCENTS.cyan}22` : "transparent", color: t.text,
            }}>{c}</button>
          ))}
        </div>
      </div>
      <div style={S.grid}>
        {accessories.map(a => {
          const inBag = bag.includes(a.id);
          return (
            <div key={a.id} className="picker-card" style={{ ...S.card, padding: 14, border: `1px solid ${inBag ? ACCENTS.lime : t.border}` }}>
              <div style={{ height: 90, marginBottom: 8, padding: 10 }}><AccessorySVG shape={a.shape} color={a.color} /></div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.name}</div>
              <div style={{ fontSize: 10.5, color: t.muted, marginBottom: 8 }}>{a.category}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13 }}>${a.price}</span>
                <button onClick={() => toggleBag(a.id)} style={{
                  fontSize: 11, fontWeight: 700, padding: "6px 10px", borderRadius: 999, cursor: "pointer",
                  border: "none", background: inBag ? ACCENTS.lime : ACCENTS.coral, color: "#140b06",
                }}>{inBag ? "Added ✓" : "Add to Bag"}</button>
              </div>
            </div>
          );
        })}
        {accessories.length === 0 && <p style={{ color: t.muted, fontSize: 13 }}>No accessories match — try another filter.</p>}
      </div>
    </div>
  );
}

/* ============================================================
   STEP 3 — CUSTOMIZE
   ============================================================ */
function StepCustomize(props) {
  const {
    S, t, stageRef, selectedModel, placed, accessories, selectedInstance, setSelectedInstance,
    onItemPointerDown, onResizeStart, onRotateStart, deleteInstance, duplicateInstance,
    bringToFront, sendToBack, reorderLayer, setInstanceColor, setInstanceOpacity,
    undo, redo, canUndo, canRedo, resetDesign, snapGuide, styleScore, scoreMessage, dark,
  } = props;

  const sorted = [...placed].sort((a, b) => a.z - b.z);
  const selected = placed.find(p => p.instanceId === selectedInstance);
  const selectedAcc = selected ? accessories.find(a => a.id === selected.accessoryId) : null;
  const dominant = placed[placed.length - 1] ? accessories.find(a => a.id === placed[placed.length - 1].accessoryId)?.color : ACCENTS.coral;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18 }}>
      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <button style={S.iconBtn(false)} onClick={undo} disabled={!canUndo} title="Undo"><Undo2 size={16} /></button>
        <button style={S.iconBtn(false)} onClick={redo} disabled={!canRedo} title="Redo"><Redo2 size={16} /></button>
        <button style={{ ...S.btnGhost, padding: "8px 14px" }} onClick={resetDesign}>Reset Design</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr 240px", gap: 18, alignItems: "start" }} className="studio-grid">
        {/* LAYERS PANEL */}
        <div style={{ ...S.card, order: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
            <LayersIcon size={14} /> Layers
          </div>
          {[...sorted].reverse().map((p, i) => {
            const a = accessories.find(x => x.id === p.accessoryId);
            return (
              <div key={p.instanceId} onClick={() => setSelectedInstance(p.instanceId)} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "7px 8px", borderRadius: 8, cursor: "pointer",
                background: p.instanceId === selectedInstance ? `${ACCENTS.coral}1c` : "transparent",
                border: `1px solid ${p.instanceId === selectedInstance ? ACCENTS.coral : "transparent"}`,
                marginBottom: 4,
              }}>
                <div style={{ width: 22, height: 22, background: t.panelSolid, borderRadius: 6, padding: 3 }}>
                  <AccessorySVG shape={a?.shape} color={p.color} />
                </div>
                <span style={{ fontSize: 11.5, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a?.name}</span>
                <button onClick={(e) => { e.stopPropagation(); reorderLayer(p.instanceId, "up"); }} style={{ background: "none", border: "none", color: t.faint, cursor: "pointer" }}><ArrowUp size={12} /></button>
                <button onClick={(e) => { e.stopPropagation(); reorderLayer(p.instanceId, "down"); }} style={{ background: "none", border: "none", color: t.faint, cursor: "pointer" }}><ArrowDown size={12} /></button>
              </div>
            );
          })}
          {sorted.length === 0 && <p style={{ fontSize: 11.5, color: t.muted }}>No accessories placed. Go back to add some.</p>}

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${t.border}` }}>
            <StyleGauge score={styleScore} t={t} />
            <div style={{ fontSize: 11.5, color: t.muted, textAlign: "center", marginTop: 6 }}>{scoreMessage}</div>
          </div>
        </div>

        {/* STAGE */}
        <div style={{ order: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            position: "relative", width: 260, height: 528, borderRadius: 40,
            background: `radial-gradient(circle at 50% 35%, ${dominant}22, transparent 70%)`,
          }}>
            <div ref={stageRef} onPointerDown={() => setSelectedInstance(null)} style={{
              position: "absolute", left: 20, top: 40, width: 220, height: 448,
            }}>
              {selectedModel ? <PhoneSVG model={selectedModel} /> : <div style={{ color: t.muted, fontSize: 12 }}>No iPhone selected</div>}
              {snapGuide != null && (
                <div style={{ position: "absolute", left: snapGuide, top: -10, bottom: -10, width: 1, borderLeft: `1px dashed ${ACCENTS.cyan}` }} />
              )}
              {sorted.map(p => {
                const a = accessories.find(x => x.id === p.accessoryId);
                if (!a) return null;
                const isSel = p.instanceId === selectedInstance;
                return (
                  <div key={p.instanceId}
                    onPointerDown={(e) => onItemPointerDown(e, p)}
                    style={{
                      position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, zIndex: p.z,
                      transform: `rotate(${p.rot}deg)`, opacity: p.opacity ?? 1, cursor: "grab", touchAction: "none",
                      outline: isSel ? `2px dashed ${ACCENTS.cyan}` : "none", outlineOffset: 4,
                    }}>
                    <AccessorySVG shape={a.shape} color={p.color || a.color} />
                    {isSel && (
                      <>
                        <div onPointerDown={(e) => onRotateStart(e, p)} title="Rotate" style={{
                          position: "absolute", left: "50%", top: -26, transform: "translateX(-50%)",
                          width: 20, height: 20, borderRadius: "50%", background: ACCENTS.cyan, color: "#04201d",
                          display: "flex", alignItems: "center", justifyContent: "center", cursor: "grab",
                        }}><RotateCw size={12} /></div>
                        <div onPointerDown={(e) => onResizeStart(e, p)} title="Resize" style={{
                          position: "absolute", right: -8, bottom: -8, width: 16, height: 16, borderRadius: 5,
                          background: ACCENTS.amber, cursor: "nwse-resize", border: "2px solid #241a04",
                        }} />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: t.muted, textAlign: "center" }}>
            Drag to move · drag the amber handle to resize · drag the cyan dot to rotate
          </div>
        </div>

        {/* CONTROLS PANEL */}
        <div style={{ ...S.card, order: 3 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
            {selectedAcc ? selectedAcc.name : "Select an item"}
          </div>
          {selected ? (
            <>
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                <button style={S.iconBtn(false)} onClick={() => duplicateInstance(selected.instanceId)} title="Duplicate"><Copy size={14} /></button>
                <button style={S.iconBtn(false)} onClick={() => bringToFront(selected.instanceId)} title="Bring to front"><ArrowUp size={14} /></button>
                <button style={S.iconBtn(false)} onClick={() => sendToBack(selected.instanceId)} title="Send to back"><ArrowDown size={14} /></button>
                <button style={{ ...S.iconBtn(false), color: ACCENTS.coral }} onClick={() => deleteInstance(selected.instanceId)} title="Delete"><Trash2 size={14} /></button>
              </div>
              {selectedAcc?.colorable && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: t.muted, marginBottom: 6 }}>Color</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[ACCENTS.coral, ACCENTS.lime, ACCENTS.cyan, ACCENTS.amber, "#1B1533", "#F5F3FF"].map(c => (
                      <button key={c} onClick={() => setInstanceColor(selected.instanceId, c)} style={{
                        width: 22, height: 22, borderRadius: "50%", background: c, cursor: "pointer",
                        border: selected.color === c ? `2px solid ${t.text}` : `1px solid ${t.border}`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginBottom: 4 }}>
                <div style={{ fontSize: 11, color: t.muted, marginBottom: 6 }}>Opacity</div>
                <input type="range" min="0.2" max="1" step="0.05" value={selected.opacity ?? 1}
                  onChange={e => setInstanceOpacity(selected.instanceId, parseFloat(e.target.value))}
                  style={{ width: "100%" }} />
              </div>
            </>
          ) : (
            <p style={{ fontSize: 12, color: t.muted }}>Tap an accessory on the phone to edit its position, color, and layer.</p>
          )}
        </div>
      </div>
      <style>{`
        @media (max-width: 860px) {
          .studio-grid { grid-template-columns: 1fr !important; }
          .studio-grid > div:nth-child(2) { order: 1 !important; }
          .studio-grid > div:nth-child(1) { order: 2 !important; }
          .studio-grid > div:nth-child(3) { order: 3 !important; }
        }
      `}</style>
    </div>
  );
}

function StyleGauge({ score, t }) {
  const r = 34, c = 2 * Math.PI * r;
  const offset = c - (score / 99) * c;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="90" height="90" viewBox="0 0 90 90">
        <circle cx="45" cy="45" r={r} fill="none" stroke={t.border} strokeWidth="8" />
        <circle cx="45" cy="45" r={r} fill="none" stroke={ACCENTS.lime} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset} transform="rotate(-90 45 45)" />
        <text x="45" y="50" textAnchor="middle" fontSize="18" fontFamily="'JetBrains Mono', monospace" fill={t.text} fontWeight="700">{score}</text>
      </svg>
      <div style={{ fontSize: 10, color: t.muted, letterSpacing: 1 }}>STYLE SCORE</div>
    </div>
  );
}

/* ============================================================
   STEP 4 — PREVIEW
   ============================================================ */
function StepPreview({ S, t, selectedModel, placed, accessories, bagAccessories, saveDesign, setStep, showCelebrate }) {
  const sorted = [...placed].sort((a, b) => a.z - b.z);
  const subtotal = bagAccessories.reduce((s, a) => s + a.price, 0);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }} className="preview-grid">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {showCelebrate && (
          <div style={{ position: "absolute", top: -30, fontSize: 13, color: ACCENTS.lime, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700 }}>
            ✦ Perfect Match! ✦
          </div>
        )}
        <div style={{ position: "relative", width: 220, height: 448 }}>
          {selectedModel && <PhoneSVG model={selectedModel} />}
          {sorted.map(p => {
            const a = accessories.find(x => x.id === p.accessoryId);
            if (!a) return null;
            return (
              <div key={p.instanceId} style={{
                position: "absolute", left: p.x, top: p.y, width: p.w, height: p.h, zIndex: p.z,
                transform: `rotate(${p.rot}deg)`, opacity: p.opacity ?? 1,
              }}>
                <AccessorySVG shape={a.shape} color={p.color || a.color} />
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 24, marginBottom: 2 }}>{selectedModel?.name}</h1>
        <p style={{ color: t.muted, fontSize: 13, marginBottom: 16 }}>Your finished design</p>
        <div style={{ marginBottom: 16 }}>
          {bagAccessories.map(a => (
            <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: 13 }}>
              <span>{a.name}</span><span style={{ fontFamily: "'JetBrains Mono', monospace" }}>${a.price}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>
            <span>Total</span><span>${subtotal}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={S.btnPrimary} onClick={saveDesign}><Save size={15} /> Save Design</button>
          <button style={S.btnGhost} onClick={() => setStep(3)}><ChevronLeft size={15} /> Edit Design</button>
          <button style={S.btnGhost}><Download size={15} /> Download Preview</button>
        </div>
      </div>
      <style>{`@media (max-width: 760px) { .preview-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  );
}

/* ============================================================
   DRAWER (generic)
   ============================================================ */
function Drawer({ onClose, title, children, t, dark, wide }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)" }} />
      <div style={{
        position: "relative", width: wide ? "min(680px, 92vw)" : "min(360px, 92vw)", height: "100%",
        background: dark ? "#171128" : "#FFFFFF", borderLeft: `1px solid ${t.border}`,
        padding: 20, overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 16 }}>{title}</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: t.muted, cursor: "pointer" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ============================================================
   ADMIN PANEL
   ============================================================ */
function AdminPanel({ t, S, dark, authed, pw, setPw, onAuth, onClose, tab, setTab, models, addModel, updateModel, deleteModel, accessories, addAccessory, updateAccessory, deleteAccessory, savedDesigns }) {
  if (!authed) {
    return (
      <Drawer onClose={onClose} title="Admin Settings" t={t} dark={dark}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 12.5, color: t.muted }}><Lock size={13} style={{ verticalAlign: -2 }} /> Enter the admin password to manage models, accessories, and saved designs.</p>
          <input style={S.input} type="password" placeholder="Password (hint: admin123)" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === "Enter" && onAuth()} />
          <button style={S.btnPrimary} onClick={onAuth}>Unlock</button>
        </div>
      </Drawer>
    );
  }
  return (
    <Drawer onClose={onClose} title="Admin Settings" t={t} dark={dark} wide>
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["models", "accessories", "designs"].map(k => (
          <button key={k} onClick={() => setTab(k)} style={{
            padding: "7px 14px", borderRadius: 999, fontSize: 12, cursor: "pointer", textTransform: "capitalize",
            border: `1px solid ${tab === k ? ACCENTS.coral : t.border}`, background: tab === k ? `${ACCENTS.coral}22` : "transparent", color: t.text,
          }}>{k}</button>
        ))}
      </div>
      {tab === "models" && <AdminModels t={t} S={S} models={models} addModel={addModel} updateModel={updateModel} deleteModel={deleteModel} />}
      {tab === "accessories" && <AdminAccessories t={t} S={S} accessories={accessories} models={models} addAccessory={addAccessory} updateAccessory={updateAccessory} deleteAccessory={deleteAccessory} />}
      {tab === "designs" && (
        <div>
          {savedDesigns.length === 0 && <p style={{ fontSize: 12.5, color: t.muted }}>No saved customer designs yet.</p>}
          {savedDesigns.map(d => (
            <div key={d.id} style={{ padding: "10px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12.5 }}>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div style={{ color: t.muted }}>{d.placed.length} items · ${d.total}</div>
            </div>
          ))}
        </div>
      )}
    </Drawer>
  );
}

function AdminModels({ t, S, models, addModel, updateModel, deleteModel }) {
  const [form, setForm] = useState({ name: "", color: "#8E8E93", cameraLayout: "triangle", backImage: "", width: 300, height: 612 });
  return (
    <div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Add iPhone Model</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input style={S.input} placeholder="Model name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input style={S.input} type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          <select style={S.input} value={form.cameraLayout} onChange={e => setForm({ ...form, cameraLayout: e.target.value })}>
            <option value="single">Single camera</option>
            <option value="dual-diagonal">Dual — diagonal</option>
            <option value="dual-vertical">Dual — vertical</option>
            <option value="triangle">Triple — triangle</option>
          </select>
          <input style={S.input} placeholder="Back image URL (optional)" value={form.backImage} onChange={e => setForm({ ...form, backImage: e.target.value })} />
        </div>
        <button style={{ ...S.btnPrimary, marginTop: 10, padding: "8px 16px" }} onClick={() => { if (form.name) { addModel(form); setForm({ ...form, name: "" }); } }}>
          <Plus size={14} /> Add Model
        </button>
      </div>
      {models.map(m => (
        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12.5 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: m.color }} />
          <span style={{ flex: 1 }}>{m.name}</span>
          <span style={{ color: t.muted, fontSize: 11 }}>{m.cameraLayout}</span>
          <button onClick={() => deleteModel(m.id)} style={{ background: "none", border: "none", color: ACCENTS.coral, cursor: "pointer" }}><Trash size={13} /></button>
        </div>
      ))}
    </div>
  );
}

function AdminAccessories({ t, S, accessories, addAccessory, updateAccessory, deleteAccessory }) {
  const [form, setForm] = useState({
    name: "", category: CATEGORIES[0], shape: "case", price: 20, color: "#FF4F79",
    imageUrl: "", transparentImageUrl: "", compatibleModels: "all",
    defaultX: 0, defaultY: 0, defaultW: 220, defaultH: 448, defaultRot: 0, defaultZ: 5,
    colorable: true, enabled: true,
  });
  return (
    <div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Add Accessory</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <input style={S.input} placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <select style={S.input} value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select style={S.input} value={form.shape} onChange={e => setForm({ ...form, shape: e.target.value })}>
            {SHAPES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input style={S.input} type="number" placeholder="Price" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} />
          <input style={S.input} type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} />
          <input style={S.input} placeholder="Image URL (optional)" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} />
          <input style={S.input} placeholder="Transparent PNG URL (optional)" value={form.transparentImageUrl} onChange={e => setForm({ ...form, transparentImageUrl: e.target.value })} />
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <input type="checkbox" checked={form.colorable} onChange={e => setForm({ ...form, colorable: e.target.checked })} /> Colorable
          </label>
        </div>
        <button style={{ ...S.btnPrimary, marginTop: 10, padding: "8px 16px" }} onClick={() => { if (form.name) { addAccessory(form); setForm({ ...form, name: "" }); } }}>
          <Plus size={14} /> Add Accessory
        </button>
      </div>
      {accessories.map(a => (
        <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: `1px solid ${t.border}`, fontSize: 12.5 }}>
          <div style={{ width: 14, height: 14, borderRadius: 4, background: a.color }} />
          <span style={{ flex: 1 }}>{a.name}</span>
          <span style={{ color: t.muted, fontSize: 11 }}>${a.price}</span>
          <button onClick={() => updateAccessory(a.id, { enabled: a.enabled === false ? true : false })} style={{ background: "none", border: "none", color: a.enabled === false ? t.faint : ACCENTS.lime, cursor: "pointer" }}>
            {a.enabled === false ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
          <button onClick={() => deleteAccessory(a.id)} style={{ background: "none", border: "none", color: ACCENTS.coral, cursor: "pointer" }}><Trash size={13} /></button>
        </div>
      ))}
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
