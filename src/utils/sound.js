// Lightweight 8-bit sound system.
//
// Sounds are generated on the fly with the Web Audio API (simple square /
// triangle / sine oscillator blips) so no external audio assets are needed.
// The ON/OFF preference is kept in module state (mirrored to localStorage)
// so any part of the app can call `playSound(...)` without prop-drilling a
// "is sound on" flag through every component.

const STORAGE_KEY = "go-human-sound";
const PET_COOLDOWN_MS = 220;

let audioCtx = null;
let enabled = readInitialEnabled();
let lastPetPlayedAt = 0;

function readInitialEnabled() {
  if (typeof localStorage === "undefined") return true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Sound is ON by default — only an explicit saved "false" turns it off.
    return saved === null ? true : saved === "true";
  } catch {
    return true;
  }
}

export function isSoundEnabled() {
  return enabled;
}

export function setSoundEnabled(value) {
  enabled = Boolean(value);
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled));
  } catch {
    // localStorage may be unavailable (private mode, etc.) — the toggle
    // still works for the current session.
  }
}

function getAudioContext() {
  if (typeof window === "undefined") return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!audioCtx) {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Plays a short sequence of oscillator "notes". Each note gets its own tiny
// attack/decay envelope so it sounds like a crisp retro blip rather than a
// harsh on/off click.
function playTones(notes) {
  const ctx = getAudioContext();
  if (!ctx) return;

  const master = ctx.createGain();
  master.gain.value = 0.22;
  master.connect(ctx.destination);

  notes.forEach(({ freq, start = 0, duration = 0.08, type = "square", gain = 1 }) => {
    const startTime = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    env.gain.setValueAtTime(0.0001, startTime);
    env.gain.linearRampToValueAtTime(gain, startTime + 0.008);
    env.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(env);
    env.connect(master);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);
  });
}

// Named sound "recipes" — kept short, blippy, and cozy rather than modern
// notification-style tones.
const SOUND_RECIPES = {
  click: () => playTones([{ freq: 520, duration: 0.045, type: "square", gain: 0.4 }]),

  toggle: () => playTones([{ freq: 440, duration: 0.05, type: "square", gain: 0.4 }]),

  drawer: () =>
    playTones([
      { freq: 440, duration: 0.05, type: "square", gain: 0.35 },
      { freq: 660, start: 0.045, duration: 0.07, type: "square", gain: 0.4 },
    ]),

  success: () =>
    playTones([
      { freq: 523.25, duration: 0.07, type: "square", gain: 0.42 },
      { freq: 783.99, start: 0.06, duration: 0.12, type: "square", gain: 0.45 },
    ]),

  levelup: () =>
    playTones([
      { freq: 523.25, duration: 0.09, type: "square", gain: 0.42 },
      { freq: 659.25, start: 0.08, duration: 0.09, type: "square", gain: 0.45 },
      { freq: 783.99, start: 0.16, duration: 0.09, type: "square", gain: 0.45 },
      { freq: 1046.5, start: 0.24, duration: 0.18, type: "square", gain: 0.5 },
    ]),

  reward: () =>
    playTones([
      { freq: 880, duration: 0.05, type: "triangle", gain: 0.4 },
      { freq: 1108.73, start: 0.05, duration: 0.06, type: "triangle", gain: 0.4 },
      { freq: 1318.51, start: 0.11, duration: 0.14, type: "triangle", gain: 0.45 },
    ]),

  pet: () =>
    playTones([
      { freq: 740, duration: 0.045, type: "sine", gain: 0.3 },
      { freq: 988, start: 0.04, duration: 0.07, type: "sine", gain: 0.35 },
    ]),
};

// Plays a named sound if the global sound setting is ON. Unknown names fall
// back to a plain click so a typo never throws.
export function playSound(name) {
  if (!enabled) return;
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
