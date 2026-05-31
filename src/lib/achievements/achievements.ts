export interface AchievementDef {
  id: string
  name: string
  desc: string
  icon: string
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_round',  name: 'First Blood',    icon: '⚡', desc: 'Complete your first round' },
  { id: 'wpm_30',       name: 'Getting There',  icon: '🎯', desc: 'Hit 30 WPM' },
  { id: 'wpm_50',       name: 'Half Century',   icon: '🔥', desc: 'Hit 50 WPM' },
  { id: 'wpm_80',       name: 'Speed Demon',    icon: '⚔', desc: 'Hit 80 WPM' },
  { id: 'wpm_100',      name: 'Centurion',      icon: '✦', desc: 'Break 100 WPM' },
  { id: 'streak_10',    name: 'On Fire',        icon: '🔗', desc: '10-key streak in a round' },
  { id: 'streak_30',    name: 'Unstoppable',    icon: '⛓', desc: '30-key streak in a round' },
  { id: 'perfect',      name: 'Flawless',       icon: '◆', desc: '100% accuracy in a round' },
  { id: 'zero_lifts',   name: 'Anchored',       icon: '⚓', desc: 'Round with zero finger lifts' },
  { id: 'no_errors',    name: 'Clean Hands',    icon: '○', desc: 'Round with zero errors' },
  { id: 'play_7',       name: 'Week Warrior',   icon: '📅', desc: 'Play 7 different days' },
  { id: 'play_30',      name: 'Dedicated',      icon: '🗓', desc: 'Play 30 different days' },
  { id: 'all_layers',   name: 'Full Board',     icon: '♟', desc: 'Unlock all 9 layers' },
  { id: 'grandmaster',  name: 'Grandmaster',    icon: '✦', desc: 'Reach Grandmaster rank' },
  { id: 'daily_3',      name: 'Daily Devotion', icon: '☀', desc: 'Complete 3 daily challenges' },
  { id: 'daily_7',      name: 'Ritual',         icon: '★', desc: 'Complete 7 daily challenges' },
  { id: 'speed_burst',  name: 'Sprinter',       icon: '⚡', desc: 'Complete a Speed Burst round' },
  { id: 'blind_round',  name: 'Eyes Closed',    icon: '◉', desc: 'Complete a round in Blind mode' },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map(a => [a.id, a]))

export function checkAchievements(
  unlocked: Record<string, number>,
  data: {
    wpm: number
    accuracy: number
    longestStreak: number
    wrongCount: number
    liftCount: number
    totalSessions: number
    daysPlayed: number
    layersUnlocked: number
    rankId: string
    dailyCount: number
    isSpeedBurst: boolean
    isBlind: boolean
  }
): string[] {
  const now = Date.now()
  const newly: string[] = []

  function check(id: string, condition: boolean) {
    if (condition && !unlocked[id]) {
      unlocked[id] = now
      newly.push(id)
    }
  }

  check('first_round',  data.totalSessions >= 1)
  check('wpm_30',       data.wpm >= 30)
  check('wpm_50',       data.wpm >= 50)
  check('wpm_80',       data.wpm >= 80)
  check('wpm_100',      data.wpm >= 100)
  check('streak_10',    data.longestStreak >= 10)
  check('streak_30',    data.longestStreak >= 30)
  check('perfect',      data.accuracy === 100)
  check('zero_lifts',   data.liftCount === 0 && data.totalSessions > 0)
  check('no_errors',    data.wrongCount === 0)
  check('play_7',       data.daysPlayed >= 7)
  check('play_30',      data.daysPlayed >= 30)
  check('all_layers',   data.layersUnlocked >= 9)
  check('grandmaster',  data.rankId === 'grandmaster')
  check('daily_3',      data.dailyCount >= 3)
  check('daily_7',      data.dailyCount >= 7)
  check('speed_burst',  data.isSpeedBurst)
  check('blind_round',  data.isBlind)

  return newly
}
