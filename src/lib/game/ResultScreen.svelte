<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import type { RoundResult } from '../lessons/LessonEngine'
  import { getRank, getNextRank, rankProgress } from '../ranks/chess'
  import { sounds } from '../audio/sounds'

  export let result: RoundResult
  export let showRankUp: boolean = false
  export let newRank: { piece: string; name: string; color: string } | null = null
  export let prevWpm: number = 0
  export let prevAcc: number = 0
  export let userName: string = ''
  export let wasDaily: boolean = false

  const dispatch = createEventDispatcher<{ retry: void; next: void; home: void }>()

  const rank       = getRank(result.wpm, result.accuracy)
  const nextRank   = getNextRank(rank)
  const prog       = rankProgress(result.wpm, result.accuracy)
  const progBefore = rankProgress(prevWpm, prevAcc)
  const wpmToNext  = nextRank ? Math.max(0, nextRank.wpmMin - result.wpm) : 0
  const wpmDelta   = result.wpm - prevWpm  // positive = improvement

  const weakFinger = Object.entries(result.fingerErrors)
    .sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  // WPM count-up
  let displayWpm = 0
  let visible = false

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === ' ')      { e.preventDefault(); dispatch('retry') }
    else if (e.key === 'Enter')  { e.preventDefault(); dispatch('next') }
    else if (e.key === 'Escape') { e.preventDefault(); dispatch('home') }
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown)
    if (showRankUp) sounds.rankUp()
    else sounds.missionComplete()

    // stagger: play entrance animation first, then count up WPM
    setTimeout(() => { visible = true }, 60)

    const target   = result.wpm
    const duration = 900
    const startTs  = performance.now()
    function tick(now: number) {
      const t = Math.min((now - startTs) / duration, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      displayWpm = Math.round(ease * target)
      if (t < 1) requestAnimationFrame(tick)
    }
    setTimeout(() => requestAnimationFrame(tick), 100)
  })

  onDestroy(() => window.removeEventListener('keydown', onKeyDown))

  $: accuracyColor = result.accuracy >= 95 ? '#34d399'
    : result.accuracy >= 85 ? '#fbbf24'
    : '#f87171'
</script>

<div class="result-screen" class:visible>
  <!-- Rank-up ceremony -->
  {#if showRankUp && newRank}
    <div class="rank-up-wrap rank-appear">
      <div class="rank-glow" style="background: radial-gradient(circle, {newRank.color}22 0%, transparent 70%)"></div>
      <div class="rank-piece" style="color: {newRank.color}; filter: drop-shadow(0 0 24px {newRank.color}88)">
        {newRank.piece}
      </div>
      <div class="rank-name" style="color: {newRank.color}">{newRank.name}</div>
      <div class="rank-badge">rank unlocked</div>
    </div>
  {/if}

  <!-- Personalised greeting -->
  {#if wasDaily}
    <div class="personal-msg daily-msg">
      📅 daily challenge complete{userName ? `, ${userName}` : ''}!
    </div>
  {:else if userName}
    <div class="personal-msg">nice work, {userName}</div>
  {/if}

  <!-- Hero WPM -->
  <div class="wpm-hero">
    <div class="wpm-number" style="font-variant-numeric: tabular-nums">{displayWpm}</div>
    <div class="wpm-unit">WPM</div>
  </div>

  <!-- Secondary stats row -->
  <div class="secondary-stats">
    <div class="s-stat">
      <div class="s-val" style="color: {accuracyColor}">{result.accuracy}%</div>
      <div class="s-label">accuracy</div>
    </div>
    <div class="s-divider"></div>
    <div class="s-stat">
      <div class="s-val">{result.longestStreak}</div>
      <div class="s-label">best streak</div>
    </div>
    <div class="s-divider"></div>
    <div class="s-stat">
      <div class="s-val" style={result.wrongCount > 0 ? 'color:#f87171' : 'color:#34d399'}>{result.wrongCount}</div>
      <div class="s-label">errors</div>
    </div>
    <div class="s-divider"></div>
    <div class="s-stat">
      <div class="s-val">{Math.round(result.duration)}s</div>
      <div class="s-label">time</div>
    </div>
  </div>

  <!-- Rank + progress delta -->
  <div class="rank-section">
    <div class="rank-current">
      <span class="rank-piece-sm" style="color: {rank.color}">{rank.piece}</span>
      <span class="rank-name-sm" style="color: {rank.color}">{rank.name}</span>
      {#if wpmDelta > 0}
        <span class="wpm-delta gain">+{wpmDelta} wpm</span>
      {:else if wpmDelta < 0}
        <span class="wpm-delta loss">{wpmDelta} wpm</span>
      {:else if prevWpm > 0}
        <span class="wpm-delta flat">no change</span>
      {/if}
    </div>

    {#if nextRank}
      <div class="rank-progress-wrap">
        <div class="rank-bar">
          <!-- before marker -->
          {#if progBefore > 0 && progBefore < 1}
            <div
              class="rank-bar-before"
              style="width: {Math.round(progBefore * 100)}%"
            ></div>
          {/if}
          <!-- current fill (animates in) -->
          <div
            class="rank-bar-fill"
            style="width: {Math.round(prog * 100)}%; background: {nextRank.color}; box-shadow: 0 0 8px {nextRank.color}66;"
          ></div>
        </div>
        <div class="rank-bar-labels">
          <span class="rank-next-label">
            {#if wpmToNext > 0}
              {wpmToNext} wpm to {nextRank.piece} {nextRank.name}
            {:else}
              ready for {nextRank.piece} {nextRank.name}
            {/if}
          </span>
          <span class="rank-pct">{Math.round(prog * 100)}%</span>
        </div>
      </div>
    {:else}
      <span class="rank-next-label" style="color: {rank.color}">peak rank achieved ✦</span>
    {/if}
  </div>

  <!-- Weak finger -->
  {#if weakFinger}
    <div class="weak-finger-hint">
      <span class="weak-label">weak finger —</span>
      <span style="color: var(--finger-{weakFinger})">{weakFinger.replace('-', ' ')}</span>
      <span class="weak-label">— next drill targets it</span>
    </div>
  {/if}

  <!-- Actions -->
  <div class="actions">
    <button class="btn" on:click={() => dispatch('retry')}>
      retry <kbd>space</kbd>
    </button>
    <button class="btn btn-primary" on:click={() => dispatch('next')}>
      next drill <kbd>enter</kbd>
    </button>
    <button class="btn btn-ghost" on:click={() => dispatch('home')}>
      home <kbd>esc</kbd>
    </button>
  </div>
</div>

<style>
  .personal-msg {
    font-size: 13px;
    color: var(--muted);
    letter-spacing: 0.06em;
    font-style: italic;
    animation: fade-up 0.4s ease both;
  }

  .daily-msg {
    color: #fbbf24;
    font-style: normal;
    font-weight: 600;
    font-size: 14px;
    letter-spacing: 0.04em;
  }

  .result-screen {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 28px;
    height: 100%;
    padding: 40px;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.4s ease, transform 0.4s ease;
  }

  .result-screen.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Rank-up ─────────────────────────────────────── */
  .rank-up-wrap {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .rank-glow {
    position: absolute;
    inset: -40px;
    border-radius: 50%;
    pointer-events: none;
  }

  .rank-piece {
    font-size: 72px;
    line-height: 1;
    position: relative;
  }

  .rank-name {
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    position: relative;
  }

  .rank-badge {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }

  /* ── Hero WPM ────────────────────────────────────── */
  .wpm-hero {
    display: flex;
    align-items: baseline;
    gap: 12px;
    line-height: 1;
  }

  .wpm-number {
    font-size: 96px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.04em;
    line-height: 1;
    min-width: 3ch;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .wpm-unit {
    font-size: 18px;
    font-weight: 400;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding-bottom: 8px;
  }

  /* ── Secondary stats ─────────────────────────────── */
  .secondary-stats {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1px solid var(--border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--surface);
  }

  .s-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 28px;
    animation: fade-up 0.5s ease both;
  }

  .s-stat:nth-child(1) { animation-delay: 0.15s; }
  .s-stat:nth-child(3) { animation-delay: 0.25s; }
  .s-stat:nth-child(5) { animation-delay: 0.35s; }
  .s-stat:nth-child(7) { animation-delay: 0.45s; }

  .s-val {
    font-size: 28px;
    font-weight: 700;
    color: var(--muted);
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 0.2s;
  }

  .s-label {
    font-size: 9px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.12em;
  }

  .s-divider {
    width: 1px;
    height: 40px;
    background: var(--border);
    flex-shrink: 0;
  }

  /* ── Rank section ────────────────────────────────── */
  .rank-section {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .rank-current {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .rank-piece-sm { font-size: 20px; }

  .rank-name-sm {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .rank-progress-wrap {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .rank-bar {
    position: relative;
    width: 220px;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .rank-bar-before {
    position: absolute;
    top: 0; left: 0;
    height: 100%;
    background: var(--border);
    border-radius: 2px;
  }

  .rank-bar-fill {
    position: absolute;
    top: 0; left: 0;
    height: 100%;
    border-radius: 2px;
    transition: width 0.9s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .rank-bar-labels {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 220px;
  }

  .rank-next-label {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  .rank-pct {
    font-size: 10px;
    color: #4b5563;
    font-variant-numeric: tabular-nums;
  }

  .wpm-delta {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 7px;
    border-radius: 3px;
    letter-spacing: 0.04em;
    margin-left: 4px;
  }

  .gain { color: #34d399; background: #34d39912; border: 1px solid #34d39930; }
  .loss { color: #f87171; background: #f8717112; border: 1px solid #f8717130; }
  .flat { color: #6b7280; background: #6b728010; border: 1px solid #6b728025; }

  /* ── Weak finger ─────────────────────────────────── */
  .weak-finger-hint {
    font-size: 12px;
    color: var(--muted);
    display: flex;
    gap: 5px;
  }

  .weak-label { color: var(--muted); }

  /* ── Actions ─────────────────────────────────────── */
  .actions {
    display: flex;
    gap: 10px;
  }

  .btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
    letter-spacing: 0.02em;
  }

  .btn:hover {
    border-color: var(--muted);
    color: var(--muted);
  }

  .btn-primary {
    border-color: #fbbf2466;
    color: #fbbf24;
  }

  .btn-primary:hover {
    border-color: #fbbf24;
    background: #fbbf2410;
  }

  .btn-ghost {
    opacity: 0.35;
    border-color: transparent;
  }

  .btn-ghost:hover {
    opacity: 0.6;
    border-color: var(--border);
  }

  kbd {
    display: inline-block;
    padding: 1px 5px;
    border: 1px solid currentColor;
    border-radius: 3px;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
    opacity: 0.4;
  }

  @media (max-width: 640px) {
    .result-screen {
      padding: 52px 12px 32px;
      overflow-y: auto;
      height: auto;
      min-height: 100dvh;
      justify-content: flex-start;
    }
    .s-stat { padding: 10px 14px; }
    .s-val { font-size: 22px; }
    .rank-section { flex-direction: column; align-items: flex-start; gap: 10px; }
    .rank-bar, .rank-bar-labels { width: 100%; }
    .btn-row { flex-wrap: wrap; }
  }
</style>
