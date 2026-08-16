// GO HUMAN sound system.
//
// Everything here is generated on the fly with the Web Audio API (square /
// triangle / sine oscillators) so no external audio assets are needed.
//
// This file owns two independent things:
//   1. SFX  — short one-shot blips triggered by UI interactions.
//   2. BGM  — a small looping 8-bit soundtrack with a Day and a Night
//      variant, scheduled ahead of time so it sounds like real music
//      instead of a handful of random beeps.
//
// SFX and BGM each have their own ON/OFF preference, persisted separately
// in localStorage, so a user can mix-and-match freely.

const SFX_STORAGE_KEY = "go-human-sound"; // kept from the original single toggle
const BGM_STORAGE_KEY = "go-human-bgm";
const SFX_VOLUME_STORAGE_KEY = "go-human-sfx-volume";
const BGM_VOLUME_STORAGE_KEY = "go-human-bgm-volume";
const PET_COOLDOWN_MS = 220;

const DEFAULT_SFX_VOLUME = 0.8;
const DEFAULT_BGM_VOLUME = 0.7;

let audioCtx = null;

let sfxEnabled = readStoredEnabled(SFX_STORAGE_KEY);
let bgmEnabled = readStoredEnabled(BGM_STORAGE_KEY);
let sfxVolume = readStoredVolume(SFX_VOLUME_STORAGE_KEY, DEFAULT_SFX_VOLUME);
let bgmVolume = readStoredVolume(BGM_VOLUME_STORAGE_KEY, DEFAULT_BGM_VOLUME);

let lastPetPlayedAt = 0;

function clamp01(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return 0;
  return Math.min(1, Math.max(0, num));
}

function readStoredEnabled(key) {
  if (typeof localStorage === "undefined") return true;
  try {
    const saved = localStorage.getItem(key);
    // Sound is ON by default — only an explicit saved "false" turns it off.
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

function writeStoredEnabled(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // localStorage may be unavailable (private mode, etc.) — the toggle
    // still works for the current session.
  }
}

function readStoredVolume(key, defaultValue) {
  if (typeof localStorage === "undefined") return defaultValue;
  try {
    const saved = localStorage.getItem(key);
    if (saved === null) return defaultValue;
    const parsed = Number(saved);
    return Number.isFinite(parsed) ? clamp01(parsed) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function writeStoredVolume(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // localStorage may be unavailable (private mode, etc.) — the slider
    // still works for the current session.
  }
}

// --------------------------------------------------------------------------
// Shared AudioContext
// --------------------------------------------------------------------------

// Returns the single shared AudioContext, creating it lazily. Does NOT try
// to resume a suspended context on its own — browsers only allow that from
// inside a real user-gesture call stack, which is why `initAudio()` below
// exists as an explicit entry point to call from a click/tap/key handler.
function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  return audioCtx;
}

// Call this from inside a user-gesture handler (click/tap/keydown). Creates
// the AudioContext if needed and resumes it if the browser suspended it
// under autoplay restrictions. Safe to call repeatedly.
export function initAudio() {
  const ctx = getAudioContext();
  if (!ctx) return null;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
  return ctx;
}

// --------------------------------------------------------------------------
// SFX
// --------------------------------------------------------------------------

export function isSoundEnabled() {
  return sfxEnabled;
}

export function setSoundEnabled(value) {
  sfxEnabled = Boolean(value);
  writeStoredEnabled(SFX_STORAGE_KEY, sfxEnabled);
}

export function getSfxVolume() {
  return sfxVolume;
}

// Sets SFX volume (0–1) immediately and persists it. This is independent of
// isSoundEnabled()/setSoundEnabled() — muting and volume are separate
// controls, exactly like a normal mixer.
export function setSfxVolume(value) {
  sfxVolume = clamp01(value);
  writeStoredVolume(SFX_VOLUME_STORAGE_KEY, sfxVolume);

  if (sfxBus) {
    const ctx = sfxBus.context;
    const now = ctx.currentTime;
    sfxBus.gain.cancelScheduledValues(now);
    sfxBus.gain.setValueAtTime(sfxBus.gain.value, now);
    sfxBus.gain.linearRampToValueAtTime(sfxVolume, now + 0.05);
  }
}

// Plays a short sequence of oscillator "notes" through their own gain
// envelope so each one sounds like a crisp retro blip rather than a harsh
// on/off click. `sfxGain` is the shared bus all one-shot SFX go through.
let sfxBus = null;
function getSfxBus(ctx) {
  if (!sfxBus || sfxBus.context !== ctx) {
    sfxBus = ctx.createGain();
    sfxBus.gain.value = sfxVolume; // overall SFX loudness — see per-note gains below
    sfxBus.connect(ctx.destination);
  }
  return sfxBus;
}

function playTones(notes) {
  const ctx = initAudio();
  if (!ctx) return;

  const bus = getSfxBus(ctx);

  notes.forEach(({ freq, start = 0, duration = 0.12, type = "square", gain = 1 }) => {
    const startTime = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    // Fast attack so it stays "blippy", slower release so it's actually
    // audible instead of vanishing in a couple of milliseconds.
    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.012);
    env.gain.setValueAtTime(gain, startTime + duration * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(env);
    env.connect(bus);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.03);
  });
}

// Named sound "recipes" — kept cozy, warm and pixel-art styled rather than
// modern notification-style tones. Durations and gains are tuned so every
// sound is clearly audible on its own (not just "everything louder").
const SOUND_RECIPES = {
  // Crisp little pixel blip.
  click: () => playTones([{ freq: 610, duration: 0.09, type: "square", gain: 0.55 }]),

  // Small two-note switch sound (day/night toggle).
  toggle: () =>
    playTones([
      { freq: 392.0, duration: 0.08, type: "square", gain: 0.5 },
      { freq: 523.25, start: 0.075, duration: 0.13, type: "square", gain: 0.55 },
    ]),

  // Short drawer-opening chime.
  drawer: () =>
    playTones([
      { freq: 440.0, duration: 0.09, type: "square", gain: 0.42 },
      { freq: 587.33, start: 0.07, duration: 0.1, type: "square", gain: 0.48 },
      { freq: 739.99, start: 0.14, duration: 0.16, type: "triangle", gain: 0.5 },
    ]),

  // Satisfying little 8-bit success melody.
  success: () =>
    playTones([
      { freq: 523.25, duration: 0.1, type: "square", gain: 0.5 },
      { freq: 659.25, start: 0.09, duration: 0.1, type: "square", gain: 0.52 },
      { freq: 783.99, start: 0.18, duration: 0.22, type: "square", gain: 0.56 },
    ]),

  // More noticeable celebratory jingle.
  levelup: () =>
    playTones([
      { freq: 523.25, duration: 0.11, type: "square", gain: 0.5 },
      { freq: 659.25, start: 0.1, duration: 0.11, type: "square", gain: 0.52 },
      { freq: 783.99, start: 0.2, duration: 0.11, type: "square", gain: 0.55 },
      { freq: 1046.5, start: 0.3, duration: 0.15, type: "square", gain: 0.6 },
      { freq: 1318.51, start: 0.44, duration: 0.32, type: "square", gain: 0.62 },
    ]),

  // Magical but still pixel-art sounding reward unlock.
  reward: () =>
    playTones([
      { freq: 880.0, duration: 0.08, type: "triangle", gain: 0.46 },
      { freq: 1108.73, start: 0.07, duration: 0.09, type: "triangle", gain: 0.48 },
      { freq: 1318.51, start: 0.15, duration: 0.12, type: "triangle", gain: 0.5 },
      { freq: 1760.0, start: 0.26, duration: 0.26, type: "sine", gain: 0.4 },
    ]),

  // Cute soft "boop" / happy reaction — stays gentle on purpose.
  pet: () =>
    playTones([
      { freq: 740.0, duration: 0.07, type: "sine", gain: 0.36 },
      { freq: 988.0, start: 0.06, duration: 0.1, type: "sine", gain: 0.4 },
    ]),
};

// Plays a named sound if the global SFX setting is ON. Unknown names fall
// back to a plain click so a typo never throws.
export function playSound(name) {
  if (!sfxEnabled) return;
  const recipe = SOUND_RECIPES[name] || SOUND_RECIPES.click;
  try {
    recipe();
  } catch {
    // Audio can fail for reasons outside our control (autoplay policy,
    // unsupported browser, etc.) — never let a sound failure break the UI.
  }
}

// Same as playSound("pet") but throttled so rapid/repeated petting can't
// spam the same sound over and over.
export function playPetSound() {
  const nowTs = Date.now();
  if (nowTs - lastPetPlayedAt < PET_COOLDOWN_MS) return;
  lastPetPlayedAt = nowTs;
  playSound("pet");
}

// --------------------------------------------------------------------------
// BGM — a small looping 8-bit soundtrack with Day / Night variants.
// --------------------------------------------------------------------------
//
// Implemented as a classic Web-Audio "lookahead scheduler": a lightweight
// timer wakes up every 25ms and schedules any notes that fall inside the
// next ~120ms onto the AudioContext's own clock. This keeps timing sample
// accurate (setTimeout alone drifts) while only ever having a handful of
// oscillators alive at once — never an unbounded number.

const SCHEDULER_INTERVAL_MS = 25;
const SCHEDULE_AHEAD_SECONDS = 0.12;

// Frequencies used below (C4 octave and up).
const NOTE = {
  C3: 130.81,
  F3: 174.61,
  G3: 196.0,
  A3: 220.0,
  C4: 261.63,
  D4: 293.66,
  E4: 329.63,
  F4: 349.23,
  G4: 392.0,
  A4: 440.0,
  C5: 523.25,
  D5: 587.33,
  E5: 659.25,
  F5: 698.46,
  G5: 783.99,
};

// Each variant is a 16-step pattern (two 8-step bars) so the loop has a
// little melodic movement instead of repeating one bar verbatim — that's
// the "subtle variation" that keeps it from feeling completely robotic.
const BGM_VARIANTS = {
  day: {
    bpm: 100,
    melodyType: "square",
    bassType: "triangle",
    melodyGain: 0.16,
    bassGain: 0.14,
    noteLenRatio: 0.62,
    // prettier-ignore
    melody: [
      NOTE.C5, null, NOTE.E5, NOTE.G5, null, NOTE.E5, NOTE.D5, null,
      NOTE.C5, null, NOTE.F5, NOTE.E5, null, NOTE.D5, NOTE.C5, null,
    ],
    // prettier-ignore
    bass: [
      NOTE.C4, null, null, null, NOTE.G3, null, null, null,
      NOTE.F3, null, null, null, NOTE.G3, null, null, null,
    ],
  },
  night: {
    bpm: 68,
    melodyType: "sine",
    bassType: "triangle",
    melodyGain: 0.12,
    bassGain: 0.1,
    noteLenRatio: 0.85,
    // prettier-ignore
    melody: [
      NOTE.C4, null, NOTE.E4, null, NOTE.G4, null, NOTE.E4, null,
      NOTE.A3, null, NOTE.C4, null, NOTE.F4, null, NOTE.D4, null,
    ],
    // prettier-ignore
    bass: [
      NOTE.C3, null, null, null, NOTE.G3, null, null, null,
      NOTE.F3, null, null, null, NOTE.C3, null, null, null,
    ],
  },
};

let bgmMasterGain = null; // fades between variants / on stop
let bgmMelodyGain = null;
let bgmBassGain = null;

let bgmSchedulerId = null;
let bgmRunToken = 0; // bumped on every start/stop so stray timers no-op
let bgmNextStepTime = 0;
let bgmStepIndex = 0;
let bgmCurrentVariantName = "day";
let bgmIsRunning = false;

function ensureBgmGraph(ctx) {
  if (bgmMasterGain && bgmMasterGain.context === ctx) return;

  bgmMasterGain = ctx.createGain();
  bgmMasterGain.gain.value = 1;
  bgmMasterGain.connect(ctx.destination);

  bgmMelodyGain = ctx.createGain();
  bgmMelodyGain.connect(bgmMasterGain);

  bgmBassGain = ctx.createGain();
  bgmBassGain.connect(bgmMasterGain);
}

function scheduleBgmNote(ctx, gainBus, freq, type, startTime, duration, peakGain) {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);

  env.gain.setValueAtTime(0.0001, startTime);
  env.gain.linearRampToValueAtTime(peakGain, startTime + 0.015);
  env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  osc.connect(env);
  env.connect(gainBus);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.03);
}

function bgmSchedulerTick(ctx, runToken) {
  if (runToken !== bgmRunToken) return; // a stop/restart happened — bail out

  while (bgmNextStepTime < ctx.currentTime + SCHEDULE_AHEAD_SECONDS) {
    const variant = BGM_VARIANTS[bgmCurrentVariantName] || BGM_VARIANTS.day;
    const stepSeconds = 60 / variant.bpm / 2; // eighth notes
    const step = bgmStepIndex % variant.melody.length;

    const melodyFreq = variant.melody[step];
    if (melodyFreq) {
      scheduleBgmNote(
        ctx,
        bgmMelodyGain,
        melodyFreq,
        variant.melodyType,
        bgmNextStepTime,
        stepSeconds * variant.noteLenRatio,
        variant.melodyGain
      );
    }

    const bassFreq = variant.bass[step];
    if (bassFreq) {
      scheduleBgmNote(
        ctx,
        bgmBassGain,
        bassFreq,
        variant.bassType,
        bgmNextStepTime,
        stepSeconds * 2.2,
        variant.bassGain
      );
    }

    bgmNextStepTime += stepSeconds;
    bgmStepIndex += 1;
  }
}

export function isBgmEnabled() {
  return bgmEnabled;
}

export function getBgmVolume() {
  return bgmVolume;
}

// Sets BGM volume (0–1) immediately and persists it. Independent of
// isBgmEnabled()/setBgmEnabled() — dragging the slider to 0 silences the
// music without touching the ON/OFF (mute) preference, and vice versa.
export function setBgmVolume(value) {
  bgmVolume = clamp01(value);
  writeStoredVolume(BGM_VOLUME_STORAGE_KEY, bgmVolume);

  if (bgmIsRunning && bgmMasterGain && audioCtx) {
    const now = audioCtx.currentTime;
    bgmMasterGain.gain.cancelScheduledValues(now);
    bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
    bgmMasterGain.gain.linearRampToValueAtTime(bgmVolume, now + 0.05);
  }
}

// Starts the BGM loop for the given day/night variant. Safe to call
// multiple times / rapidly — it always tears down any previous scheduler
// first so toggling BGM on/off quickly never stacks up multiple loops.
export function startBgm(dayNight = bgmCurrentVariantName) {
  const ctx = initAudio();
  if (!ctx) return;

  stopBgm(); // guarantees a clean slate — never more than one loop running

  bgmCurrentVariantName = dayNight === "night" ? "night" : "day";
  ensureBgmGraph(ctx);

  bgmMasterGain.gain.cancelScheduledValues(ctx.currentTime);
  bgmMasterGain.gain.setValueAtTime(0.0001, ctx.currentTime);
  bgmMasterGain.gain.linearRampToValueAtTime(bgmVolume, ctx.currentTime + 0.8);

  bgmRunToken += 1;
  const runToken = bgmRunToken;
  bgmStepIndex = 0;
  bgmNextStepTime = ctx.currentTime + 0.05;
  bgmIsRunning = true;

  bgmSchedulerTick(ctx, runToken);
  bgmSchedulerId = setInterval(() => bgmSchedulerTick(ctx, runToken), SCHEDULER_INTERVAL_MS);
}

// Stops and cleans up the scheduler so nothing keeps scheduling notes.
// Any already-scheduled notes still playing are short one-shots and finish
// naturally rather than cutting off with a click.
export function stopBgm() {
  bgmRunToken += 1; // invalidates any in-flight tick from the old loop
  if (bgmSchedulerId !== null) {
    clearInterval(bgmSchedulerId);
    bgmSchedulerId = null;
  }
  bgmIsRunning = false;
}

// Smoothly crossfades the currently-playing BGM into the Day or Night
// variant. If BGM isn't running, this just remembers the variant for the
// next startBgm() call — nothing plays until the user turns BGM on.
export function setBgmDayNight(dayNight) {
  const nextVariant = dayNight === "night" ? "night" : "day";
  if (nextVariant === bgmCurrentVariantName && bgmIsRunning) return;

  if (!bgmIsRunning || !audioCtx) {
    bgmCurrentVariantName = nextVariant;
    return;
  }

  const ctx = audioCtx;
  const FADE_SECONDS = 0.5;
  const now = ctx.currentTime;

  bgmMasterGain.gain.cancelScheduledValues(now);
  bgmMasterGain.gain.setValueAtTime(bgmMasterGain.gain.value, now);
  bgmMasterGain.gain.linearRampToValueAtTime(0.0001, now + FADE_SECONDS);

  setTimeout(() => {
    bgmCurrentVariantName = nextVariant;
    if (!audioCtx) return;
    const resumeTime = audioCtx.currentTime;
    // Re-align the scheduler cleanly on the new variant instead of picking
    // up mid-bar, so the switch feels intentional rather than glitchy.
    bgmStepIndex = 0;
    bgmNextStepTime = resumeTime + 0.02;
    bgmMasterGain.gain.cancelScheduledValues(resumeTime);
    bgmMasterGain.gain.setValueAtTime(0.0001, resumeTime);
    bgmMasterGain.gain.linearRampToValueAtTime(bgmVolume, resumeTime + FADE_SECONDS);
  }, FADE_SECONDS * 1000);
}

// Turns BGM on/off and persists the preference. When turning on, this
// should be called from a user-gesture handler (it calls initAudio()
// internally) so the browser's autoplay policy allows it to actually play.
export function setBgmEnabled(value, dayNight) {
  bgmEnabled = Boolean(value);
  writeStoredEnabled(BGM_STORAGE_KEY, bgmEnabled);

  if (bgmEnabled) {
    startBgm(dayNight);
  } else {
    stopBgm();
  }
}
