export interface LayerProgress {
  layerId: number
  bestWpm: number
  bestAccuracy: number
  attempts: number
  unlocked: boolean
}

export interface FingerStats {
  finger: string
  totalPresses: number
  errors: number
}

export interface KeyStat {
  key: string
  presses: number
  errors: number
}

export interface SessionRecord {
  ts: number
  layerId: number
  wpm: number
  accuracy: number
  duration: number
  isDaily?: boolean
  isSpeedBurst?: boolean
  isBlind?: boolean
}

export type FluidBg = 'aurora' | 'metal' | 'topo' | 'silk' | 'blobs' | 'wireframe' | 'smoke' | 'grain' | 'particles' | 'fog' | 'off'

export interface Settings {
  soundEnabled: boolean
  metronomeEnabled: boolean
  anchorHintsEnabled: boolean
  blindMode: boolean
  theme: 'dark' | 'light'
  fluidBg: FluidBg
  userName: string
}

export interface GhostRun {
  layerId: number
  sequence: string[]
  timestamps: number[]
  wpm: number
}

export interface Progress {
  layers:       Record<number, LayerProgress>
  fingers:      Record<string, FingerStats>
  keyStats:     Record<string, KeyStat>
  sessions:     SessionRecord[]
  daysPlayed:   string[]           // unique YYYY-MM-DD strings
  streak:       number
  lastPlayDate: string
  achievements: Record<string, number>  // id → timestamp unlocked
  dailyCount:   number
  ghosts:       Record<number, GhostRun>
  settings:     Settings
  totalSessions: number
  lastSession:   number
}

const KEY = 'neurotype:progress'

function defaultSettings(): Settings {
  return { soundEnabled: true, metronomeEnabled: false, anchorHintsEnabled: true, blindMode: false, theme: 'light', fluidBg: 'aurora', userName: '' }
}

function defaultProgress(): Progress {
  return {
    layers: {
      0: { layerId: 0, bestWpm: 0, bestAccuracy: 0, attempts: 0, unlocked: true },
    },
    fingers:      {},
    keyStats:     {},
    sessions:     [],
    daysPlayed:   [],
    streak:       0,
    lastPlayDate: '',
    achievements: {},
    dailyCount:   0,
    ghosts:       {},
    settings:     defaultSettings(),
    totalSessions: 0,
    lastSession:   0,
  }
}

export function loadProgress(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultProgress()
    const p = JSON.parse(raw) as Progress
    if (!p.layers)       p.layers       = { 0: { layerId: 0, bestWpm: 0, bestAccuracy: 0, attempts: 0, unlocked: true } }
    if (!p.keyStats)     p.keyStats     = {}
    if (!p.sessions)     p.sessions     = []
    if (!p.daysPlayed)   p.daysPlayed   = []
    if (!p.achievements) p.achievements = {}
    if (!p.ghosts)       p.ghosts       = {}
    if (!p.settings)     p.settings     = defaultSettings()
    if (!p.settings.theme)    p.settings.theme    = 'light'
    if (p.settings.userName === undefined) p.settings.userName = ''
    if (!p.settings.fluidBg || !['aurora','metal','topo','silk','blobs','wireframe','smoke','grain','particles','fog','off'].includes(p.settings.fluidBg)) p.settings.fluidBg = 'aurora'
    if (p.streak === undefined) p.streak = 0
    if (!p.lastPlayDate) p.lastPlayDate = ''
    if (!p.dailyCount)   p.dailyCount   = 0
    return p
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(p: Progress): void {
  // cap sessions at last 200
  if (p.sessions.length > 200) p.sessions = p.sessions.slice(-200)
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function saveSettings(settings: Settings): void {
  const p = loadProgress()
  p.settings = settings
  saveProgress(p)
}

export function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

export function recordResult(
  layerId: number,
  wpm: number,
  accuracy: number,
  fingerErrors: Record<string, number>,
  keyErrors: Record<string, number>,
  keyPresses: Record<string, number>,
  nextLayerUnlockWpm: number,
  opts: { isDaily?: boolean; isSpeedBurst?: boolean; isBlind?: boolean; liftCount?: number; duration?: number } = {}
): Progress {
  const p = loadProgress()
  const today = todayStr()

  // layer stats
  if (!p.layers[layerId]) {
    p.layers[layerId] = { layerId, bestWpm: 0, bestAccuracy: 0, attempts: 0, unlocked: false }
  }
  const layer = p.layers[layerId]
  layer.attempts++
  if (wpm > layer.bestWpm) layer.bestWpm = wpm
  if (accuracy > layer.bestAccuracy) layer.bestAccuracy = accuracy

  // unlock next layer
  if (wpm >= nextLayerUnlockWpm) {
    const nextId = layerId + 1
    if (!p.layers[nextId]) {
      p.layers[nextId] = { layerId: nextId, bestWpm: 0, bestAccuracy: 0, attempts: 0, unlocked: true }
    } else {
      p.layers[nextId].unlocked = true
    }
  }

  // finger stats
  for (const [finger, errors] of Object.entries(fingerErrors)) {
    if (!p.fingers[finger]) p.fingers[finger] = { finger, totalPresses: 0, errors: 0 }
    p.fingers[finger].errors += errors
  }

  // per-key stats
  for (const [key, total] of Object.entries(keyPresses)) {
    if (!p.keyStats[key]) p.keyStats[key] = { key, presses: 0, errors: 0 }
    p.keyStats[key].presses += total
  }
  for (const [key, errors] of Object.entries(keyErrors)) {
    if (!p.keyStats[key]) p.keyStats[key] = { key, presses: 0, errors: 0 }
    p.keyStats[key].errors += errors
  }

  // session history
  p.sessions.push({
    ts: Date.now(),
    layerId,
    wpm,
    accuracy,
    duration: opts.duration ?? 0,
    isDaily: opts.isDaily,
    isSpeedBurst: opts.isSpeedBurst,
    isBlind: opts.isBlind,
  })

  // days played + streak
  if (!p.daysPlayed.includes(today)) {
    p.daysPlayed.push(today)
  }

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  if (p.lastPlayDate === yesterday) {
    p.streak++
  } else if (p.lastPlayDate !== today) {
    p.streak = 1
  }
  p.lastPlayDate = today

  if (opts.isDaily) p.dailyCount++

  p.totalSessions++
  p.lastSession = Date.now()

  saveProgress(p)
  return p
}

export function saveGhostRun(layerId: number, sequence: string[], timestamps: number[], wpm: number): void {
  const p = loadProgress()
  const existing = p.ghosts[layerId]
  if (!existing || wpm > existing.wpm) {
    p.ghosts[layerId] = { layerId, sequence, timestamps, wpm }
    saveProgress(p)
  }
}

export function getWeakKeys(p: Progress, topN = 8): string[] {
  return Object.values(p.keyStats)
    .filter(s => s.presses >= 3 && s.errors / s.presses > 0.05)
    .sort((a, b) => (b.errors / b.presses) - (a.errors / a.presses))
    .slice(0, topN)
    .map(s => s.key)
}

export function weakestFinger(p: Progress): string | null {
  let worst: string | null = null
  let worstRate = -1
  for (const f of Object.values(p.fingers)) {
    if (f.totalPresses === 0) continue
    const rate = f.errors / f.totalPresses
    if (rate > worstRate) { worstRate = rate; worst = f.finger }
  }
  return worst
}

export function resetLayerScores(layerId: number): void {
  const p = loadProgress()
  if (!p.layers[layerId]) return
  p.layers[layerId].bestWpm = 0
  p.layers[layerId].bestAccuracy = 0
  p.layers[layerId].attempts = 0
  saveProgress(p)
}

export function resetLayerFull(layerId: number): void {
  const p = loadProgress()
  if (!p.layers[layerId]) return
  p.layers[layerId].bestWpm = 0
  p.layers[layerId].bestAccuracy = 0
  p.layers[layerId].attempts = 0
  if (layerId > 0) {
    p.layers[layerId].unlocked = false
    for (const id of Object.keys(p.layers).map(Number)) {
      if (id > layerId) {
        if (!p.layers[id]) continue
        p.layers[id].unlocked = false
        p.layers[id].bestWpm = 0
        p.layers[id].bestAccuracy = 0
        p.layers[id].attempts = 0
      }
    }
  }
  saveProgress(p)
}

export function resetProgress(): void {
  localStorage.removeItem(KEY)
  localStorage.removeItem('neurotype:onboarded')
}
