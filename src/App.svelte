<script lang="ts">
  import HomeScreen       from './lib/game/HomeScreen.svelte'
  import TypingZone       from './lib/game/TypingZone.svelte'
  import ResultScreen     from './lib/game/ResultScreen.svelte'
  import SpeedBurst       from './lib/game/SpeedBurst.svelte'
  import RaceScreen       from './lib/race/RaceScreen.svelte'
  import StatsScreen      from './lib/stats/StatsScreen.svelte'
  import SettingsScreen   from './lib/settings/SettingsScreen.svelte'
  import AchievementToast from './lib/game/AchievementToast.svelte'
  import FluidBg          from './lib/game/FluidBg.svelte'

  import { onMount } from 'svelte'
  import { getLayer }                          from './lib/lessons/patterns'
  import { recordResult, loadProgress, saveProgress } from './lib/lessons/progress'
  import { getRank }                           from './lib/ranks/chess'
  import { checkAchievements }                 from './lib/achievements/achievements'
  import type { RoundResult }                  from './lib/lessons/LessonEngine'

  type Screen = 'home' | 'lesson' | 'result' | 'burst' | 'race' | 'stats' | 'settings'

  let screen        : Screen = 'home'
  let activeLayerId  = 0
  let lastResult    : RoundResult | null = null
  let showRankUp     = false
  let newRank       : { piece: string; name: string; color: string } | null = null
  let prevWpm        = 0
  let prevAcc        = 0
  let newAchievements: string[] = []
  let isBlind        = false
  let fluidVariant   = loadProgress().settings.fluidBg ?? 'aurora'

  $: activeLayer = getLayer(activeLayerId)

  onMount(() => {
    const s = loadProgress().settings
    document.documentElement.setAttribute('data-theme', s.theme ?? 'dark')
    fluidVariant = s.fluidBg ?? 'aurora'
  })

  function onSettingsBack() {
    const s = loadProgress().settings
    document.documentElement.setAttribute('data-theme', s.theme ?? 'dark')
    fluidVariant = s.fluidBg ?? 'aurora'
    screen = 'home'
  }

  function startLesson(id: number) {
    activeLayerId   = id
    newAchievements = []
    isBlind         = loadProgress().settings.blindMode
    screen          = 'lesson'
  }

  function handleRoundDone(result: RoundResult, opts: { isSpeedBurst?: boolean } = {}) {
    lastResult = result

    const prevProgress = loadProgress()
    prevWpm = Math.max(...Object.values(prevProgress.layers).map(l => l.bestWpm), 0)
    prevAcc = Math.max(...Object.values(prevProgress.layers).map(l => l.bestAccuracy), 0)
    const prevRank = getRank(prevWpm, prevAcc)

    const layer = getLayer(activeLayerId)!
    const p = recordResult(
      activeLayerId, result.wpm, result.accuracy,
      result.fingerErrors, result.keyErrors, result.keyPresses,
      layer.unlockWpm + 1,
      { isSpeedBurst: opts.isSpeedBurst, isBlind, duration: result.duration }
    )

    const newRankObj = getRank(result.wpm, result.accuracy)
    showRankUp = newRankObj.id !== prevRank.id
    newRank    = showRankUp
      ? { piece: newRankObj.piece, name: newRankObj.name, color: newRankObj.color }
      : null

    // Check + persist achievements
    newAchievements = checkAchievements(p.achievements, {
      wpm:            result.wpm,
      accuracy:       result.accuracy,
      longestStreak:  result.longestStreak,
      wrongCount:     result.wrongCount,
      liftCount:      0,
      totalSessions:  p.totalSessions,
      daysPlayed:     p.daysPlayed.length,
      layersUnlocked: Object.values(p.layers).filter(l => l.unlocked).length,
      rankId:         newRankObj.id,
      dailyCount:     p.dailyCount,
      isSpeedBurst:   !!opts.isSpeedBurst,
      isBlind,
    })
    if (newAchievements.length > 0) saveProgress(p)

    screen = 'result'
  }

  function retry() {
    newAchievements = []
    screen = 'lesson'
  }

  function nextDrill() {
    const nextId = activeLayerId + 1
    const layer  = getLayer(nextId)
    const p      = loadProgress()
    newAchievements = []
    if (layer && p.layers[nextId]?.unlocked) startLesson(nextId)
    else startLesson(activeLayerId)
  }
</script>

<FluidBg variant={fluidVariant} />

<div class="app">
  {#if screen === 'home'}
    <HomeScreen
      on:start={(e) => startLesson(e.detail)}
      on:stats={() => screen = 'stats'}
      on:settings={() => screen = 'settings'}
      on:speedburst={() => { activeLayerId = 7; screen = 'burst' }}
      on:race={() => screen = 'race'}
      on:themeChange={(e) => document.documentElement.setAttribute('data-theme', e.detail)}
      on:fluidChange={(e) => { fluidVariant = e.detail }}
    />

  {:else if screen === 'lesson' && activeLayer}
    <TypingZone
      layer={activeLayer}
      {isBlind}
      on:done={(e) => handleRoundDone(e.detail)}
      on:retry={retry}
      on:home={() => screen = 'home'}
    />

  {:else if screen === 'burst'}
    <SpeedBurst
      on:done={(e) => handleRoundDone(e.detail, { isSpeedBurst: true })}
      on:home={() => screen = 'home'}
    />

  {:else if screen === 'result' && lastResult}
    <ResultScreen
      result={lastResult}
      {showRankUp}
      {newRank}
      {prevWpm}
      {prevAcc}
      on:retry={retry}
      on:next={nextDrill}
      on:home={() => screen = 'home'}
    />

  {:else if screen === 'race'}
    <RaceScreen
      on:done={(e) => { screen = 'home' }}
      on:home={() => screen = 'home'}
    />

  {:else if screen === 'stats'}
    <StatsScreen on:back={() => screen = 'home'} />

  {:else if screen === 'settings'}
    <SettingsScreen on:back={onSettingsBack} on:fluidChange={(e) => { fluidVariant = e.detail }} />
  {/if}

  {#if newAchievements.length > 0}
    <AchievementToast ids={newAchievements} />
  {/if}
</div>

<style>
  .app {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
  }
</style>
