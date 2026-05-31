export interface Layer {
  id: number
  name: string
  description: string
  sequences: string[][]
  targetWpm: number
  unlockWpm: number
}

function seq(...keys: string[]): string[] {
  return keys
}

export const LAYERS: Layer[] = [
  {
    id: 0,
    name: 'Home Base',
    description: 'Left index + middle. F and D.',
    targetWpm: 15,
    unlockWpm: 0,
    sequences: [
      seq('f','d','f','d','f','d','f','d'),
      seq('f','f','d','d','f','f','d','d'),
      seq('d','f','d','f','d','f','d','f'),
      seq('f','d','d','f','f','d','d','f'),
    ],
  },
  {
    id: 1,
    name: 'Home Row',
    description: 'Full home row — asdf jkl;',
    targetWpm: 20,
    unlockWpm: 12,
    sequences: [
      seq('a','s','d','f','j','k','l',';'),
      seq('f','j','f','j','f','j','f','j'),
      seq('a','s','d','f','f','d','s','a'),
      seq('j','k','l',';',';','l','k','j'),
      seq('f','d','s','a',' ','j','k','l',';'),
      seq('a','f','j',';','a','f','j',';'),
    ],
  },
  {
    id: 2,
    name: 'Left Hand Rise',
    description: 'Top row — left hand only: qwert',
    targetWpm: 25,
    unlockWpm: 18,
    sequences: [
      seq('q','w','e','r','t'),
      seq('e','r','e','r','e','r'),
      seq('q','w','e','w','q'),
      seq('r','e','w','q','w','e','r'),
      seq('t','r','e','w','q'),
      seq('q','e','t','r','w','e','q'),
    ],
  },
  {
    id: 3,
    name: 'Right Hand Rise',
    description: 'Top row — right hand only: yuiop',
    targetWpm: 25,
    unlockWpm: 18,
    sequences: [
      seq('y','u','i','o','p'),
      seq('u','i','u','i','u','i'),
      seq('p','o','i','u','y'),
      seq('y','u','i','o','p','o','i','u','y'),
      seq('i','o','p','o','i'),
      seq('y','i','p','u','o','i','y'),
    ],
  },
  {
    id: 4,
    name: 'Cross Fire',
    description: 'Both hands across top row.',
    targetWpm: 30,
    unlockWpm: 22,
    sequences: [
      seq('q','p','w','o','e','i','r','u','t','y'),
      seq('y','t','u','r','i','e','o','w','p','q'),
      seq('e','u','r','y','t','i'),
      seq('q','y','w','u','e','i','r','o','t','p'),
    ],
  },
  {
    id: 5,
    name: 'Under Pressure',
    description: 'Bottom row — zxcvb nm,./  ',
    targetWpm: 28,
    unlockWpm: 22,
    sequences: [
      seq('z','x','c','v','b'),
      seq('n','m',',','.','/'),
      seq('b','v','c','x','z'),
      seq('z','c','b','v','x'),
      seq('n',',',' ','m','.'),
      seq('b',' ','n','m',' ','v'),
    ],
  },
  {
    id: 6,
    name: 'Word Patterns',
    description: 'Common bigrams and trigrams.',
    targetWpm: 35,
    unlockWpm: 28,
    sequences: [
      seq('t','h','e',' '),
      seq('a','n','d',' '),
      seq('i','n','g',' '),
      seq('t','i','o','n',' '),
      seq('e','r','s',' '),
      seq('t','h','e',' ','a','n','d',' '),
      seq('t','h','i','s',' ','i','s',' '),
      seq('f','o','r',' ','t','h','e',' '),
    ],
  },
  {
    id: 7,
    name: 'Free Flow',
    description: 'Real words. Full speed.',
    targetWpm: 50,
    unlockWpm: 35,
    sequences: [
      'the quick brown fox jumps'.split(''),
      'over the lazy dog today'.split(''),
      'type fast and think clear'.split(''),
      'fingers know the way now'.split(''),
      'speed comes from precision'.split(''),
      'every key has its finger'.split(''),
    ],
  },
  {
    id: 8,
    name: 'Anchor Return',
    description: 'Reach and return. Fingers stay home.',
    targetWpm: 30,
    unlockWpm: 20,
    sequences: [
      // Left index: reach r/t, return to f
      seq('f','r','f','t','f','r','f','t','f'),
      // Left middle: reach e, return to d
      seq('d','e','d','e','d','e','d'),
      // Left ring: reach w, return to s
      seq('s','w','s','w','s','w','s'),
      // Right index: reach u/y, return to j
      seq('j','u','j','y','j','u','j','y','j'),
      // Right middle: reach i, return to k
      seq('k','i','k','i','k','i','k'),
      // Alternating hands, both reaching
      seq('f','r','j','u','f','r','j','u'),
      // Full hand reach-return cycle
      seq('a','q','a','s','w','s','d','e','d','f','r','f'),
      // Bottom row reach-return
      seq('f','v','f','b','f','v','f'),
      seq('j','n','j','m','j','n','j'),
    ],
  },
]

export function getLayer(id: number): Layer | undefined {
  return LAYERS.find(l => l.id === id)
}

/** Weighted random pick — excludeIdx guaranteed not chosen unless no alternative */
function weightedPick(weights: number[], excludeIdx: number): number {
  const filtered = weights.map((w, i) => i === excludeIdx ? 0 : w)
  const total = filtered.reduce((a, b) => a + b, 0)
  if (total === 0) return weights.findIndex((_, i) => i !== excludeIdx)
  let r = Math.random() * total
  for (let i = 0; i < filtered.length; i++) {
    r -= filtered[i]
    if (r <= 0) return i
  }
  return filtered.findIndex(w => w > 0)
}

/**
 * Build a weight per sequence based on how many of the layer's weak keys appear in it.
 * Base weight = 1. Each weak key hit adds +3.
 * If no weak keys overlap → all weights equal → pure random behaviour.
 */
function sequenceWeights(sequences: string[][], weakKeys: Set<string>): number[] {
  return sequences.map(seq => {
    const hits = seq.filter(k => weakKeys.has(k)).length
    return 1 + hits * 3
  })
}

export function generateRound(layer: Layer, weakKeys: Set<string> = new Set(), count = 5): string[] {
  const result: string[] = []
  const weights = sequenceWeights(layer.sequences, weakKeys)
  const hasWeakBias = weakKeys.size > 0 && weights.some(w => w > 1)
  let lastIdx = -1

  for (let i = 0; i < count; i++) {
    let chosen: number

    if (hasWeakBias && Math.random() < 0.6) {
      // 60%: weighted toward sequences that contain weak keys
      chosen = weightedPick(weights, lastIdx)
    } else {
      // 40%: random (variety, prevents monotony)
      const candidates = layer.sequences.map((_, idx) => idx).filter(idx => idx !== lastIdx)
      chosen = candidates[Math.floor(Math.random() * candidates.length)]
    }

    lastIdx = chosen

    let seq = [...layer.sequences[chosen]]

    // For structured layers (not free text), occasionally reverse for variety
    if (layer.id < 7 && seq.length > 2 && Math.random() < 0.3) {
      seq = seq.reverse()
    }

    result.push(...seq)
    if (i < count - 1 && layer.id >= 1) result.push(' ')
  }
  return result
}