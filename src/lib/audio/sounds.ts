let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', gain = 0.3): void {
  const ac = getCtx()
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.connect(g)
  g.connect(ac.destination)
  osc.type = type
  osc.frequency.setValueAtTime(freq, ac.currentTime)
  g.gain.setValueAtTime(gain, ac.currentTime)
  g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration)
  osc.start(ac.currentTime)
  osc.stop(ac.currentTime + duration)
}

function chord(freqs: number[], duration: number, delay = 0, gain = 0.2): void {
  const ac = getCtx()
  freqs.forEach((freq, i) => {
    setTimeout(() => tone(freq, duration, 'sine', gain), delay * i * 1000)
  })
}

export const sounds = {
  correctKey() {
    tone(880, 0.08, 'sine', 0.15)
  },

  wrongKey() {
    tone(150, 0.12, 'triangle', 0.25)
    setTimeout(() => tone(120, 0.08, 'sawtooth', 0.1), 30)
  },

  streak10() {
    chord([523, 659, 784], 0.2, 0.08)
  },

  streakBroken() {
    tone(330, 0.1, 'sine', 0.2)
    setTimeout(() => tone(247, 0.15, 'sine', 0.15), 100)
  },

  lessonComplete() {
    const ac = getCtx()
    const notes = [523, 659, 784, 1047]
    notes.forEach((freq, i) => {
      setTimeout(() => tone(freq, 0.3, 'sine', 0.2), i * 100)
    })
  },

  personalBest() {
    tone(1047, 0.05, 'sine', 0.3)
    setTimeout(() => tone(1319, 0.05, 'sine', 0.25), 60)
    setTimeout(() => tone(1568, 0.15, 'sine', 0.2), 120)
  },

  rankUp() {
    const ac = getCtx()
    // ascending 3-note chime
    setTimeout(() => tone(523, 0.4, 'sine', 0.25), 0)
    setTimeout(() => tone(659, 0.4, 'sine', 0.25), 200)
    setTimeout(() => tone(784, 0.6, 'sine', 0.3), 400)
    // thud landing
    setTimeout(() => tone(80, 0.3, 'triangle', 0.4), 900)
    // shimmer
    setTimeout(() => {
      chord([1047, 1319, 1568], 0.5, 0.05, 0.15)
    }, 1000)
  },

  metronome() {
    tone(1200, 0.02, 'square', 0.08)
  },

  missionComplete() {
    // 3-beat rhythm pattern
    setTimeout(() => tone(880, 0.1, 'sine', 0.3), 0)
    setTimeout(() => tone(880, 0.1, 'sine', 0.3), 150)
    setTimeout(() => tone(1046, 0.25, 'sine', 0.35), 300)
  },
}