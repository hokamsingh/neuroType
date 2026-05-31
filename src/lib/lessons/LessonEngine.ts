import { sounds } from '../audio/sounds'
import { getKeyDef } from '../keyboard/layout'

export interface RoundResult {
  wpm: number
  accuracy: number
  correctCount: number
  wrongCount: number
  duration: number
  longestStreak: number
  fingerErrors: Record<string, number>
  keyErrors: Record<string, number>   // expected key → miss count
  keyPresses: Record<string, number>  // expected key → total appearances
}

export interface EngineState {
  sequence: string[]
  index: number
  correctCount: number
  wrongCount: number
  streak: number
  longestStreak: number
  fingerErrors: Record<string, number>
  keyErrors: Record<string, number>
  keyPresses: Record<string, number>
  startTime: number | null
  done: boolean
}

export function createEngine(sequence: string[]): EngineState {
  // Pre-count key appearances so we have the denominator
  const keyPresses: Record<string, number> = {}
  for (const k of sequence) {
    keyPresses[k] = (keyPresses[k] ?? 0) + 1
  }

  return {
    sequence,
    index: 0,
    correctCount: 0,
    wrongCount: 0,
    streak: 0,
    longestStreak: 0,
    fingerErrors: {},
    keyErrors: {},
    keyPresses,
    startTime: null,
    done: false,
  }
}

export function handleKeyPress(
  state: EngineState,
  key: string,
): { state: EngineState; correct: boolean; done: boolean } {
  if (state.done) return { state, correct: false, done: true }

  const s = {
    ...state,
    fingerErrors: { ...state.fingerErrors },
    keyErrors:    { ...state.keyErrors },
  }

  if (s.startTime === null) s.startTime = Date.now()

  const expected = s.sequence[s.index]
  const correct  = key === expected

  if (correct) {
    s.correctCount++
    s.streak++
    if (s.streak > s.longestStreak) s.longestStreak = s.streak
    s.index++

    if (s.streak === 10) sounds.streak10()
    else sounds.correctKey()

    if (s.index >= s.sequence.length) {
      s.done = true
      sounds.lessonComplete()
    }
  } else {
    s.wrongCount++
    s.streak = 0
    sounds.wrongKey()

    // Track per-finger error
    const keyDef = getKeyDef(expected)
    if (keyDef) {
      s.fingerErrors[keyDef.finger] = (s.fingerErrors[keyDef.finger] ?? 0) + 1
    }

    // Track per-key error (the KEY that was missed, not what was pressed)
    s.keyErrors[expected] = (s.keyErrors[expected] ?? 0) + 1
  }

  return { state: s, correct, done: s.done }
}

export function computeResult(state: EngineState): RoundResult {
  const duration = state.startTime ? (Date.now() - state.startTime) / 1000 : 1
  const words    = state.correctCount / 5
  const wpm      = Math.round((words / duration) * 60)
  const total    = state.correctCount + state.wrongCount
  const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0

  return {
    wpm,
    accuracy,
    correctCount:  state.correctCount,
    wrongCount:    state.wrongCount,
    duration,
    longestStreak: state.longestStreak,
    fingerErrors:  state.fingerErrors,
    keyErrors:     state.keyErrors,
    keyPresses:    state.keyPresses,
  }
}
