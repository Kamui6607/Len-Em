import { useEffect, useRef, useState } from "react";
import { useAnimationFrame } from "motion/react";

// ═══════════════════════════════════════════════════════════════════
// LEN&EM — "Glowing Thread" cursor system (Awwwards refinement pass)
//
// Real Mouse → Smooth Cursor → Glow → Ribbon → Particles
// Each tier eases toward the one above it at its own rate, so the
// whole scene reads as inertia cascading through layers of silk and
// dust rather than everything snapping to the pointer at once.
//
// Canvas 2D only. No WebGL / three.js / shaders.
// ═══════════════════════════════════════════════════════════════════

export type RGB = [number, number, number];

export interface CursorState {
  /** Real Mouse — raw, in CSS pixels. */
  rawX: number;
  rawY: number;
  /** Smooth Cursor — first inertia tier (kept as `x`/`y` for API stability). */
  x: number;
  y: number;
  /** Glow tier — trails the Smooth Cursor. */
  glowX: number;
  glowY: number;
  /** Ribbon tier — trails the Glow tier. */
  ribbonX: number;
  ribbonY: number;
  /** Particle-influence tier — trails the Ribbon tier (the laziest layer). */
  particleX: number;
  particleY: number;
  /** Smoothed speed of the Smooth Cursor tier, px/frame. */
  speed: number;
  /** Frame-to-frame change in speed — used for ribbon tension. */
  accel: number;
  active: boolean;
  lastMoveTime: number;
}

interface TrailPoint {
  x: number;
  y: number;
  t: number;
  speed: number;
}

// ────────────────────────── Tunable constants ───────────────────────

/** Real Mouse → Smooth Cursor. Snappiest tier; everything else lags this. */
const SMOOTH_CURSOR_SMOOTHING = 0.24;
/** Smooth Cursor → Glow. */
const GLOW_SMOOTHING = 0.16;
/** Glow → Ribbon. */
const RIBBON_SMOOTHING = 0.12;
/** Ribbon → Particle influence. The laziest, floatiest tier. */
const PARTICLE_INFLUENCE_SMOOTHING = 0.08;

const IDLE_FADE_MS = 450;
const TRAIL_MAX_POINTS = 26;
const TRAIL_MIN_POINT_DIST = 3;
const TRAIL_SUBDIVISIONS = 6;
const TRAIL_SPEED_REFERENCE = 42;

const PALETTE_CYCLE_MS = 13000;

const BREATHE_PERIOD_MS = 4200;
const BREATHE_AMPLITUDE = 0.08;
const PULSE_PERIOD_MS = 7000;
const PULSE_DURATION_MS = 900;
const PULSE_AMPLITUDE = 0.14;

/** Req 10 — color breathing: subtle hue drift, never opacity-only. */
const HUE_BREATHE_PERIOD_MS = 9000;
const HUE_BREATHE_DEGREES = 3.2; // ~2–4% of 360°... kept as a gentle degree swing

/** Req 8 — bloom distortion: shimmer, not grain. Tiny multi-frequency jitter. */
const SHIMMER_AMPLITUDE_PX = 2.4;

/** Req 4 — secondary, almost-subliminal outer bloom. */
const SECONDARY_BLOOM_RADIUS = 400; // 350–450px
const SECONDARY_BLOOM_ALPHA = 0.04; // 0.03–0.05

/** Req 3 — cinematic bloom radii. */
const OUTER_BLOOM_RADIUS = 240; // 220–260px
const INNER_BLOOM_RADIUS = 120;
const CORE_GLOW_RADIUS = 20;

const SPOTLIGHT_RADIUS = 420;
const SPOTLIGHT_ALPHA = 0.05;

const MAX_DEVICE_PIXEL_RATIO = 2;

/** Req 6 — particle repulsion. */
const PARTICLE_REPEL_RADIUS = 90;
const PARTICLE_MAX_DISPLACEMENT = 20; // "keep movement under 20px"
const PARTICLE_PUSH_EASE = 0.16; // faster: "softly move away"
const PARTICLE_RETURN_EASE = 0.055; // slower: "slowly return"

/** Warm Atelier ribbon/glow/particle stops — also doubles as the fixed
 *  head→tail gradient stops for the ribbon (req 2). */
const LIGHT_PALETTE: RGB[] = [
  [255, 246, 199], // #FFF6C7 — head
  [245, 239, 168], // #F5EFA8
  [255, 216, 180], // #FFD8B4
  [240, 196, 224], // #F0C4E0
];
const DARK_PALETTE: RGB[] = [
  [216, 194, 255], // #D8C2FF — head
  [180, 151, 232], // #B497E8
  [155, 111, 214], // #9B6FD6
  [107, 63, 160], // #6B3FA0
];

// ──────────────────────────── Small utils ───────────────────────────

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mixRGB = (a: RGB, b: RGB, t: number): RGB => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

function paletteColorAt(palette: RGB[], phase: number): RGB {
  const wrapped = ((phase % 1) + 1) % 1;
  const n = palette.length;
  const scaled = wrapped * n;
  const i = Math.floor(scaled) % n;
  const next = (i + 1) % n;
  const frac = easeInOutSine(scaled - Math.floor(scaled));
  return mixRGB(palette[i], palette[next], frac);
}

function pulseEnvelope(now: number, period: number, duration: number): number {
  const cyclePos = now % period;
  if (cyclePos > duration) return 0;
  return Math.sin((cyclePos / duration) * Math.PI);
}

function catmullRomPoint(p0: TrailPoint, p1: TrailPoint, p2: TrailPoint, p3: TrailPoint, t: number) {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
}

function buildSmoothPath(points: TrailPoint[]): TrailPoint[] {
  if (points.length < 3) return points.slice();
  const out: TrailPoint[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < TRAIL_SUBDIVISIONS; s++) {
      const t = s / TRAIL_SUBDIVISIONS;
      const pos = catmullRomPoint(p0, p1, p2, p3, t);
      out.push({ x: pos.x, y: pos.y, t: lerp(p1.t, p2.t, t), speed: lerp(p1.speed, p2.speed, t) });
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/**
 * Req 1 + 7 — a true smooth ribbon rendered as a chain of short
 * quadratic-curve strokes (not a filled offset polygon). This avoids
 * the classic "bowtie" self-intersection artifact that offset-polygon
 * ribbons get on sharp turns — the #1 cause of the jagged/ugly look.
 * Round caps + overlapping segments keep it visually seamless while
 * width still responds to velocity/acceleration/turn-sharpness.
 */
function drawRibbonPass(
  ctx: CanvasRenderingContext2D,
  dense: TrailPoint[],
  now: number,
  widthMul: number,
  headColor: RGB,
  tailColor: RGB,
  alphaMul: number,
  blur: number,
) {
  if (dense.length < 3) return;

  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.save();

  let prevAngle: number | null = null;

  // Walk the dense Catmull-Rom path two points at a time, drawing a
  // short quadratic curve through their midpoint so adjacent segments
  // blend smoothly with zero visible seams — no corners, no self-
  // intersecting geometry, ever.
  for (let i = 1; i < dense.length - 1; i++) {
    const prev = dense[i - 1];
    const cur = dense[i];
    const next = dense[i + 1];

    const age = now - cur.t;
    if (age > IDLE_FADE_MS) continue;

    const lifeT = clamp(1 - age / IDLE_FADE_MS, 0, 1);
    const speedT = clamp(cur.speed / TRAIL_SPEED_REFERENCE, 0, 1);

    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const angle = Math.atan2(dy, dx);
    let turnT = 0;
    if (prevAngle !== null) {
      let d = angle - prevAngle;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      turnT = clamp(Math.abs(d) / (Math.PI / 3), 0, 1);
    }
    prevAngle = angle;

    const velocityTaper = lerp(1.1, 0.45, speedT); // slow → soft ribbon, fast → thin streak
    const turnBump = 1 + turnT * 0.22; // sharp turn → slightly wider (fabric tension)
    const baseWidth = lerp(1.4, 11, lifeT); // was lerp(2.5, 24, lifeT) — much thinner max
    const width = Math.max(0.5, baseWidth * velocityTaper * turnBump * widthMul);

    const midX = (cur.x + next.x) / 2;
    const midY = (cur.y + next.y) / 2;
    const startMidX = (prev.x + cur.x) / 2;
    const startMidY = (prev.y + cur.y) / 2;

    const [r, g, b] = mixRGB(tailColor, headColor, lifeT);
    const alpha = lifeT * alphaMul;
    if (alpha <= 0.01) continue;

    ctx.strokeStyle = `rgba(${r | 0},${g | 0},${b | 0},${alpha.toFixed(3)})`;
    ctx.lineWidth = width;
    if (blur > 0) {
      ctx.shadowColor = `rgba(${r | 0},${g | 0},${b | 0},${(alpha * 0.7).toFixed(3)})`;
      ctx.shadowBlur = blur * lifeT;
    }

    ctx.beginPath();
    ctx.moveTo(startMidX, startMidY);
    ctx.quadraticCurveTo(cur.x, cur.y, midX, midY);
    ctx.stroke();
  }

  ctx.restore();
}

export function getGlowBlendMode(isDark: boolean): "normal" | "screen" | "plus-lighter" {
  if (!isDark) return "normal";
  const supportsPlusLighter =
    typeof CSS !== "undefined" && typeof CSS.supports === "function" && CSS.supports("mix-blend-mode", "plus-lighter");
  return supportsPlusLighter ? "plus-lighter" : "screen";
}

function setupHiDPICanvas(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
  const cssWidth = window.innerWidth;
  const cssHeight = window.innerHeight;
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { width: cssWidth, height: cssHeight };
}

/** Req 10 — applies a slow, tiny hue-rotate to a glow/ribbon canvas so
 *  color drifts instead of only pulsing in opacity. Cheap: one CSS
 *  filter string per frame, no per-pixel work. */
function applyColorBreathing(canvas: HTMLCanvasElement, now: number, blendMode: "normal" | "screen" | "plus-lighter") {
  const hue = Math.sin((now / HUE_BREATHE_PERIOD_MS) * Math.PI * 2) * HUE_BREATHE_DEGREES;
  canvas.style.mixBlendMode = blendMode;
  canvas.style.filter = `hue-rotate(${hue.toFixed(2)}deg)`;
}

// ───────────────────────── Reduced motion ───────────────────────────

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

// ───────────────────────── useSmoothCursor ──────────────────────────

/**
 * Req 5 — cascading inertia. Real Mouse feeds Smooth Cursor, which
 * feeds Glow, which feeds Ribbon, which feeds Particle-influence —
 * each at its own damping rate, so the scene reads as layered silk
 * rather than one rigid trailing dot.
 */
export function useSmoothCursor(prefersReducedMotion: boolean) {
  const cursorRef = useRef<CursorState>({
    rawX: -9999,
    rawY: -9999,
    x: -9999,
    y: -9999,
    glowX: -9999,
    glowY: -9999,
    ribbonX: -9999,
    ribbonY: -9999,
    particleX: -9999,
    particleY: -9999,
    speed: 0,
    accel: 0,
    active: false,
    lastMoveTime: 0,
  });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const state = cursorRef.current;
    const onPointer = (x: number, y: number) => {
      state.rawX = x;
      state.rawY = y;
      state.lastMoveTime = performance.now();
      state.active = true;
    };
    const onMouseMove = (e: MouseEvent) => onPointer(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) onPointer(touch.clientX, touch.clientY);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [prefersReducedMotion]);

  useAnimationFrame(() => {
    if (prefersReducedMotion || document.hidden) return;
    const state = cursorRef.current;
    const prevX = state.x;
    const prevY = state.y;
    const prevSpeed = state.speed;

    state.x += (state.rawX - state.x) * SMOOTH_CURSOR_SMOOTHING;
    state.y += (state.rawY - state.y) * SMOOTH_CURSOR_SMOOTHING;
    state.glowX += (state.x - state.glowX) * GLOW_SMOOTHING;
    state.glowY += (state.y - state.glowY) * GLOW_SMOOTHING;
    state.ribbonX += (state.glowX - state.ribbonX) * RIBBON_SMOOTHING;
    state.ribbonY += (state.glowY - state.ribbonY) * RIBBON_SMOOTHING;
    state.particleX += (state.ribbonX - state.particleX) * PARTICLE_INFLUENCE_SMOOTHING;
    state.particleY += (state.ribbonY - state.particleY) * PARTICLE_INFLUENCE_SMOOTHING;

    state.speed = Math.hypot(state.x - prevX, state.y - prevY);
    state.accel = Math.abs(state.speed - prevSpeed);

    if (performance.now() - state.lastMoveTime > IDLE_FADE_MS) state.active = false;
  });

  return cursorRef;
}

// ────────────────────────── useCursorTrail ──────────────────────────

export function useCursorTrail(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  cursorRef: React.RefObject<CursorState>,
  isDark: boolean,
  prefersReducedMotion: boolean,
) {
  const pointsRef = useRef<TrailPoint[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.style.mixBlendMode = getGlowBlendMode(isDark);
    sizeRef.current = setupHiDPICanvas(canvas, ctx);
    const onResize = () => (sizeRef.current = setupHiDPICanvas(canvas, ctx));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [canvasRef, isDark, prefersReducedMotion]);

  useAnimationFrame(() => {
    if (prefersReducedMotion || document.hidden) return;
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas || !cursor) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const now = performance.now();
    const { width, height } = sizeRef.current;
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;

    applyColorBreathing(canvas, now, getGlowBlendMode(isDark));

    // Ribbon head now anchors directly to the Glow tier position — this
    // removes the extra lag tier that was creating a visible gap between
    // the bright head and the ribbon's freshest point.
    if (cursor.active) {
      const points = pointsRef.current;
      const last = points[points.length - 1];
      if (!last || Math.hypot(cursor.glowX - last.x, cursor.glowY - last.y) >= TRAIL_MIN_POINT_DIST) {
        points.push({ x: cursor.glowX, y: cursor.glowY, t: now, speed: cursor.speed });
        if (points.length > TRAIL_MAX_POINTS) points.shift();
      }
    }
    pointsRef.current = pointsRef.current.filter((p) => now - p.t < IDLE_FADE_MS);

    ctx.clearRect(0, 0, width, height);

    const raw = pointsRef.current;
    if (raw.length < 3) return;

    const dense = buildSmoothPath(raw);
    const phase = (now % PALETTE_CYCLE_MS) / PALETTE_CYCLE_MS;
    const headColor = paletteColorAt(palette, phase);
    const tailColor = palette[palette.length - 1];

    // Soft halo pass, then a slimmer brighter core — same true-ribbon
    // geometry, just two widths/blurs, so nothing reads as segmented.
    drawRibbonPass(ctx, dense, now, isDark ? 1.35 : 1.15, headColor, tailColor, isDark ? 0.34 : 0.24, isDark ? 22 : 16);
    drawRibbonPass(ctx, dense, now, 0.4, headColor, tailColor, isDark ? 0.8 : 0.62, isDark ? 8 : 6);
  });
}

// ─────────────────────────── useCursorGlow ──────────────────────────

export function useCursorGlow(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  cursorRef: React.RefObject<CursorState>,
  isDark: boolean,
  prefersReducedMotion: boolean,
) {
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.style.mixBlendMode = getGlowBlendMode(isDark);
    sizeRef.current = setupHiDPICanvas(canvas, ctx);
    const onResize = () => (sizeRef.current = setupHiDPICanvas(canvas, ctx));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [canvasRef, isDark, prefersReducedMotion]);

  useAnimationFrame(() => {
  if (prefersReducedMotion || document.hidden) return;
  const canvas = canvasRef.current;
  const cursor = cursorRef.current;
  if (!canvas || !cursor) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const { width, height } = sizeRef.current;

  // Light mode: chỉ giữ dải ruy băng (ribbon), không cần đốm đầu phát
  // sáng — xóa canvas và dừng luôn, tránh vẽ thừa mỗi frame.
  if (!isDark) {
    ctx.clearRect(0, 0, width, height);
    return;
  }

  const now = performance.now();
  ctx.clearRect(0, 0, width, height);
  applyColorBreathing(canvas, now, getGlowBlendMode(isDark));

  const idleT = clamp((now - cursor.lastMoveTime) / IDLE_FADE_MS, 0, 1);
  const presence = cursor.active ? 1 - idleT : 0;
  if (presence <= 0.005) return;

  const gx = cursor.glowX;
  const gy = cursor.glowY;
  const palette = DARK_PALETTE;
  const phase = (now % (PALETTE_CYCLE_MS * 1.3)) / (PALETTE_CYCLE_MS * 1.3);
  const [r, g, b] = paletteColorAt(palette, phase);
  const rgb = `${r | 0},${g | 0},${b | 0}`;

  const breathe = 1 + BREATHE_AMPLITUDE * Math.sin((now / BREATHE_PERIOD_MS) * Math.PI * 2);
  const pulse = 1 + PULSE_AMPLITUDE * pulseEnvelope(now, PULSE_PERIOD_MS, PULSE_DURATION_MS);
  const scale = breathe * pulse;

  const shimmerX = (Math.sin(now * 0.0021) * 0.6 + Math.sin(now * 0.0053) * 0.4) * SHIMMER_AMPLITUDE_PX;
  const shimmerY = (Math.cos(now * 0.0018) * 0.6 + Math.sin(now * 0.0047) * 0.4) * SHIMMER_AMPLITUDE_PX;
  const sx = gx + shimmerX;
  const sy = gy + shimmerY;

  const secondaryGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, SECONDARY_BLOOM_RADIUS * scale);
  secondaryGrad.addColorStop(0, `rgba(${rgb},${(SECONDARY_BLOOM_ALPHA * presence).toFixed(3)})`);
  secondaryGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = secondaryGrad;
  ctx.beginPath();
  ctx.arc(gx, gy, SECONDARY_BLOOM_RADIUS * scale, 0, Math.PI * 2);
  ctx.fill();

  const spotlightGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, SPOTLIGHT_RADIUS * scale);
  spotlightGrad.addColorStop(0, `rgba(${rgb},${(SPOTLIGHT_ALPHA * presence).toFixed(3)})`);
  spotlightGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = spotlightGrad;
  ctx.beginPath();
  ctx.arc(gx, gy, SPOTLIGHT_RADIUS * scale, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const outerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, OUTER_BLOOM_RADIUS * scale);
  outerGrad.addColorStop(0, `rgba(${rgb},${(0.2 * presence).toFixed(3)})`);
  outerGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = outerGrad;
  ctx.beginPath();
  ctx.arc(sx, sy, OUTER_BLOOM_RADIUS * scale, 0, Math.PI * 2);
  ctx.fill();

  const innerGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, INNER_BLOOM_RADIUS * scale);
  innerGrad.addColorStop(0, `rgba(${rgb},${(0.26 * presence).toFixed(3)})`);
  innerGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = innerGrad;
  ctx.beginPath();
  ctx.arc(sx, sy, INNER_BLOOM_RADIUS * scale, 0, Math.PI * 2);
  ctx.fill();

  const coreGrad = ctx.createRadialGradient(gx, gy, 0, gx, gy, CORE_GLOW_RADIUS * scale);
  coreGrad.addColorStop(0, `rgba(${rgb},${(0.72 * presence).toFixed(3)})`);
  coreGrad.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = coreGrad;
  ctx.beginPath();
  ctx.arc(gx, gy, CORE_GLOW_RADIUS * scale, 0, Math.PI * 2);
  ctx.fill();
});
}

// ─────────────────────────── useParticles ───────────────────────────

interface Particle {
  x: number; // drift/home position
  y: number;
  dispX: number; // current repulsion displacement
  dispY: number;
  r: number;
  vx: number;
  vy: number;
  baseAlpha: number;
  twPhase: number;
  twSpeed: number;
}

export function useParticles(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  cursorRef: React.RefObject<CursorState>,
  isDark: boolean,
  prefersReducedMotion: boolean,
) {
  const particlesRef = useRef<Particle[]>([]);
  const sizeRef = useRef({ width: 0, height: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = setupHiDPICanvas(canvas, ctx);
    sizeRef.current = { width, height };

    const count = prefersReducedMotion ? 0 : isDark ? 60 : 40;
    particlesRef.current = Array.from({ length: count }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      dispX: 0,
      dispY: 0,
      r: isDark ? Math.random() * 1.3 + 0.35 : Math.random() * 1.9 + 0.7,
      vx: (Math.random() - 0.5) * (isDark ? 0.035 : 0.09),
      vy: isDark ? (Math.random() - 0.5) * 0.05 : -(Math.random() * 0.15 + 0.05),
      baseAlpha: Math.random() * 0.4 + 0.15,
      twPhase: Math.random() * Math.PI * 2,
      twSpeed: 0.008 + Math.random() * 0.018,
    }));

    const onResize = () => (sizeRef.current = setupHiDPICanvas(canvas, ctx));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [canvasRef, isDark, prefersReducedMotion]);

  useAnimationFrame(() => {
    if (document.hidden) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = sizeRef.current;
    const cursor = cursorRef.current;
    const palette = isDark ? DARK_PALETTE : LIGHT_PALETTE;
    const now = performance.now();
    const phase = (now % (PALETTE_CYCLE_MS * 0.8)) / (PALETTE_CYCLE_MS * 0.8);
    const [pr, pg, pb] = paletteColorAt(palette, phase);

    ctx.clearRect(0, 0, width, height);

    // Particle-influence tier — the laziest cascade layer (req 5).
    const px = cursor?.particleX ?? -9999;
    const py = cursor?.particleY ?? -9999;
    const cursorActive = cursor?.active ?? false;

    for (const p of particlesRef.current) {
      p.x += p.vx;
      p.y += p.vy;
      p.twPhase += p.twSpeed;

      if (p.y < -10) { p.y = height + 10; p.x = Math.random() * width; }
      if (p.y > height + 10) { p.y = -10; p.x = Math.random() * width; }
      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;

      // Req 6 — soft displacement instead of only brightening. Dust
      // drifting in a warm workshop: nudged aside, never scattered.
      let targetDispX = 0;
      let targetDispY = 0;
      let ease = PARTICLE_RETURN_EASE;

      if (cursorActive) {
        const dx = p.x - px;
        const dy = p.y - py;
        const dist = Math.hypot(dx, dy);
        if (dist < PARTICLE_REPEL_RADIUS && dist > 0.001) {
          const pushT = easeOutCubic(clamp(1 - dist / PARTICLE_REPEL_RADIUS, 0, 1));
          const amount = pushT * PARTICLE_MAX_DISPLACEMENT;
          targetDispX = (dx / dist) * amount;
          targetDispY = (dy / dist) * amount;
          ease = PARTICLE_PUSH_EASE;
        }
      }

      p.dispX += (targetDispX - p.dispX) * ease;
      p.dispY += (targetDispY - p.dispY) * ease;

      const twinkle = isDark ? Math.sin(p.twPhase) * 0.35 + 0.65 : 1;
      let alpha = p.baseAlpha * twinkle;

      if (cursorActive) {
        const dist = Math.hypot(p.x - px, p.y - py);
        const influence = clamp(1 - dist / 220, 0, 1);
        alpha *= 1 + influence * 0.5;
      }

      const renderX = p.x + p.dispX;
      const renderY = p.y + p.dispY;

      ctx.beginPath();
      ctx.arc(renderX, renderY, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${pr | 0},${pg | 0},${pb | 0},${clamp(alpha, 0, 1).toFixed(3)})`;
      ctx.fill();
    }
  });
}

// ─────────────────────────── CursorEffects component ───────────────────

import React from "react";

export function CursorEffects({ isDark }: { isDark: boolean }): React.ReactNode {
  const prefersReducedMotion = usePrefersReducedMotion();
  const cursorRef = useSmoothCursor(prefersReducedMotion);
  
  const trailCanvasRef = useRef<HTMLCanvasElement>(null);
  const glowCanvasRef = useRef<HTMLCanvasElement>(null);
  const particlesCanvasRef = useRef<HTMLCanvasElement>(null);

  useCursorTrail(trailCanvasRef, cursorRef, isDark, prefersReducedMotion);
  useCursorGlow(glowCanvasRef, cursorRef, isDark, prefersReducedMotion);
  useParticles(particlesCanvasRef, cursorRef, isDark, prefersReducedMotion);

  return React.createElement(React.Fragment, null,
    React.createElement("canvas", {
      ref: trailCanvasRef,
      style: {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9997,
      }
    }),
    React.createElement("canvas", {
      ref: glowCanvasRef,
      style: {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9998,
      }
    }),
    React.createElement("canvas", {
      ref: particlesCanvasRef,
      style: {
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 9999,
      }
    })
  );
}
