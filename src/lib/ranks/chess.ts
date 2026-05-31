export interface Rank {
  id: string
  name: string
  piece: string
  wpmMin: number
  wpmMax: number
  accuracyMin: number
  color: string
  description: string
}

export const RANKS: Rank[] = [
  {
    id: 'pawn',
    name: 'Pawn',
    piece: '♟',
    wpmMin: 0,
    wpmMax: 20,
    accuracyMin: 0,
    color: '#94a3b8',
    description: 'Just starting. Fingers still finding their way.',
  },
  {
    id: 'knight',
    name: 'Knight',
    piece: '♞',
    wpmMin: 21,
    wpmMax: 35,
    accuracyMin: 85,
    color: '#60a5fa',
    description: 'Jumpy but improving. The pattern is forming.',
  },
  {
    id: 'bishop',
    name: 'Bishop',
    piece: '♝',
    wpmMin: 36,
    wpmMax: 50,
    accuracyMin: 88,
    color: '#34d399',
    description: 'Fluid across diagonals. Muscle memory clicking in.',
  },
  {
    id: 'rook',
    name: 'Rook',
    piece: '♜',
    wpmMin: 51,
    wpmMax: 65,
    accuracyMin: 91,
    color: '#fbbf24',
    description: 'Straight power. Consistent and reliable.',
  },
  {
    id: 'queen',
    name: 'Queen',
    piece: '♛',
    wpmMin: 66,
    wpmMax: 85,
    accuracyMin: 94,
    color: '#f97316',
    description: 'Dominant. Fast and accurate across the board.',
  },
  {
    id: 'king',
    name: 'King',
    piece: '♚',
    wpmMin: 86,
    wpmMax: 100,
    accuracyMin: 96,
    color: '#e879f9',
    description: 'Controlled mastery. Every move deliberate.',
  },
  {
    id: 'grandmaster',
    name: 'Grandmaster',
    piece: '✦',
    wpmMin: 101,
    wpmMax: Infinity,
    accuracyMin: 98,
    color: '#e2c94e',
    description: 'Beyond the board. The keyboard is invisible.',
  },
]

export function getRank(wpm: number, accuracy: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    const r = RANKS[i]
    if (wpm >= r.wpmMin && accuracy >= r.accuracyMin) return r
  }
  return RANKS[0]
}

export function getNextRank(current: Rank): Rank | null {
  const idx = RANKS.findIndex(r => r.id === current.id)
  return idx < RANKS.length - 1 ? RANKS[idx + 1] : null
}

export function rankProgress(wpm: number, accuracy: number): number {
  const current = getRank(wpm, accuracy)
  const next = getNextRank(current)
  if (!next) return 1
  const range = next.wpmMin - current.wpmMin
  const pos = wpm - current.wpmMin
  return Math.min(pos / range, 1)
}
