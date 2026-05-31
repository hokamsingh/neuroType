import { writable, derived } from 'svelte/store'
import type { RoundResult } from '../lessons/LessonEngine'
import { getRank, getNextRank } from '../ranks/chess'
import { loadProgress } from '../lessons/progress'

export type Screen = 'home' | 'lesson' | 'result' | 'stats' | 'rank-up'

export const currentScreen = writable<Screen>('home')
export const currentLayerId = writable<number>(0)
export const lastResult = writable<RoundResult | null>(null)
export const previousRankId = writable<string>('pawn')
export const progress = writable(loadProgress())

export const currentRank = derived([lastResult, progress], ([$result, $progress]) => {
  if (!$result) {
    const bestWpm = Math.max(...Object.values($progress.layers).map(l => l.bestWpm), 0)
    const bestAcc = Math.max(...Object.values($progress.layers).map(l => l.bestAccuracy), 0)
    return getRank(bestWpm, bestAcc)
  }
  return getRank($result.wpm, $result.accuracy)
})

export function navigateTo(screen: Screen): void {
  currentScreen.set(screen)
}

export function startLesson(layerId: number): void {
  currentLayerId.set(layerId)
  currentScreen.set('lesson')
}
