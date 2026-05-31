<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import { LAYERS } from '../lessons/patterns'
  import { loadProgress, saveSettings, resetLayerScores, resetLayerFull, resetProgress, getWeakKeys } from '../lessons/progress'
  import { getRank, getNextRank, rankProgress } from '../ranks/chess'
  import type { FluidBg } from '../lessons/progress'

  import { onMount, onDestroy } from 'svelte'

  const dispatch = createEventDispatcher<{ start: number; daily: number; stats: void; settings: void; speedburst: void; race: void; reset: void; themeChange: 'dark'|'light'; fluidChange: FluidBg }>()

  export let userName: string = ''

  let progress = loadProgress()
  let currentTheme: 'dark'|'light' = progress.settings.theme ?? 'light'
  let currentFluid: FluidBg = progress.settings.fluidBg ?? 'aurora'

  const FLUID_OPTS: FluidBg[] = ['aurora','metal','topo','silk','blobs','wireframe','smoke','grain','particles','fog','off']
  const FLUID_ICONS: Record<FluidBg, string> = {
    aurora:'✦', metal:'⬡', topo:'⌇', silk:'≋', blobs:'◉',
    wireframe:'⊞', smoke:'≈', grain:'⁘', particles:'⁺', fog:'░', off:'○'
  }

  function quickToggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark'
    const s = loadProgress().settings
    s.theme = currentTheme
    saveSettings(s)
    document.documentElement.setAttribute('data-theme', currentTheme)
    dispatch('themeChange', currentTheme)
  }

  function quickCycleFluid() {
    const idx = FLUID_OPTS.indexOf(currentFluid)
    currentFluid = FLUID_OPTS[(idx + 1) % FLUID_OPTS.length]
    const s = loadProgress().settings
    s.fluidBg = currentFluid
    saveSettings(s)
    dispatch('fluidChange', currentFluid)
  }

  let hoveredLayer: number | null = null
  let resetMenuLayer: number | null = null
  let fullResetArmed = false
  let fullResetTimer: ReturnType<typeof setTimeout> | null = null

  $: unlockedIds = LAYERS.filter(l => !!progress.layers[l.id]?.unlocked).map(l => l.id)
  let selectedId: number = 0
  $: if (unlockedIds.length && !unlockedIds.includes(selectedId)) selectedId = unlockedIds[0]

  function onKeyDown(e: KeyboardEvent) {
    if (resetMenuLayer !== null) { resetMenuLayer = null; return }
    if (fullResetArmed) { fullResetArmed = false; return }  // any key cancels armed state

    const idx = unlockedIds.indexOf(selectedId)

    if (e.key === 'Tab') {
      e.preventDefault()
      const next = e.shiftKey ? idx - 1 : idx + 1
      selectedId = unlockedIds[Math.max(0, Math.min(next, unlockedIds.length - 1))]
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault()
      selectedId = unlockedIds[Math.min(idx + 1, unlockedIds.length - 1)]
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault()
      selectedId = unlockedIds[Math.max(idx - 1, 0)]
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      dispatch('start', selectedId)
    }
  }

  onMount(() => window.addEventListener('keydown', onKeyDown))
  onDestroy(() => window.removeEventListener('keydown', onKeyDown))

  const logoLetters = ['n','e','u','r','o','T','y','p','e']
  // one finger color per letter, in palette order
  const letterColors = [
    '#a78bfa', // left-pinky  — n
    '#60a5fa', // left-ring   — e
    '#34d399', // left-middle — u
    '#fbbf24', // left-index  — r
    '#f97316', // right-index — o
    '#f472b6', // right-middle— T
    '#38bdf8', // right-ring  — y
    '#e879f9', // right-pinky — p
    '#94a3b8', // thumb       — e
  ]
  const WAVE_DURATION = 9   // seconds per full cycle
  const WAVE_STEP     = 0.8 // seconds between letters — must be > active window (0.72s)

  function getDailyLayerId(): number {
    const now = new Date()
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
    return dayOfYear % 9
  }

  $: maxUnlockedId   = Math.max(...unlockedIds, 0)
  $: dailyLayerId    = Math.min(getDailyLayerId(), maxUnlockedId)
  $: dailyLayer      = LAYERS.find(l => l.id === dailyLayerId)
  $: todayStr        = new Date().toISOString().slice(0, 10)
  $: hasDoneDaily    = progress.sessions.some(s => s.isDaily && new Date(s.ts).toISOString().slice(0, 10) === todayStr)

  $: bestWpm      = Math.max(...Object.values(progress.layers).map(l => l.bestWpm), 0)
  $: bestAcc      = Math.max(...Object.values(progress.layers).map(l => l.bestAccuracy), 0)
  $: rank         = getRank(bestWpm, bestAcc)
  $: nextRank     = getNextRank(rank)
  $: rankProg     = rankProgress(bestWpm, bestAcc)
  $: wpmToNext    = nextRank ? Math.max(0, nextRank.wpmMin - bestWpm) : 0
  $: totalSessions = progress.totalSessions ?? 0
  $: daysPlayed   = progress.daysPlayed?.length ?? 0
  $: weakKey      = getWeakKeys(progress, 1)[0] ?? null
  $: layersUnlocked = Object.values(progress.layers).filter(l => l.unlocked).length

  function isUnlocked(id: number): boolean {
    return !!progress.layers[id]?.unlocked
  }

  function layerBest(id: number): number {
    return progress.layers[id]?.bestWpm ?? 0
  }

  function layerAttempts(id: number): number {
    return progress.layers[id]?.attempts ?? 0
  }

  function openResetMenu(e: MouseEvent, id: number) {
    e.stopPropagation()
    resetMenuLayer = resetMenuLayer === id ? null : id
  }

  function doResetScores(e: MouseEvent, id: number) {
    e.stopPropagation()
    resetLayerScores(id)
    progress = loadProgress()
    resetMenuLayer = null
  }

  function doResetFull(e: MouseEvent, id: number) {
    e.stopPropagation()
    resetLayerFull(id)
    progress = loadProgress()
    resetMenuLayer = null
  }

  function armFullReset() {
    if (fullResetArmed) {
      resetProgress()
      progress = loadProgress()
      fullResetArmed = false
      if (fullResetTimer) clearTimeout(fullResetTimer)
      dispatch('reset')
    } else {
      fullResetArmed = true
      fullResetTimer = setTimeout(() => { fullResetArmed = false }, 5000)
    }
  }

  function closeMenus() {
    resetMenuLayer = null
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="home" on:click={closeMenus}>

  <div class="quick-controls">
    <button class="qc-btn" title="cycle background" on:click|stopPropagation={quickCycleFluid}>
      {FLUID_ICONS[currentFluid]}
    </button>
    <button class="qc-btn" title="toggle theme" on:click|stopPropagation={quickToggleTheme}>
      {currentTheme === 'dark' ? '☾' : '☀'}
    </button>
  </div>

  <header class="home-header">
    <h1 class="logo" aria-label="neuroType">
      {#each logoLetters as letter, i}
        <span
          class="logo-letter"
          style="
            --flash: {letterColors[i]};
            animation-delay: {(i * WAVE_STEP).toFixed(2)}s;
            animation-duration: {WAVE_DURATION}s;
          "
        >{letter}</span>
      {/each}
    </h1>
    <div class="tagline">
      {#if userName}hey {userName} — {/if}map keys to fingers. build muscle memory fast.
    </div>
    {#if progress.streak > 0}
      <div class="streak-badge">🔥 {progress.streak} day streak</div>
    {/if}

    {#if bestWpm > 0}
      <div class="rank-section">
        <div class="rank-display" style="color: {rank.color}">
          <span class="rank-piece-icon">{rank.piece}</span>
          <span class="rank-name-text">{rank.name}</span>
          <span class="rank-wpm">{bestWpm} WPM</span>
        </div>

        {#if nextRank}
          <div class="rank-progress-row">
            <div class="rank-bar-home">
              <div
                class="rank-bar-fill-home"
                style="width: {Math.round(rankProg * 100)}%; background: {nextRank.color}; box-shadow: 0 0 6px {nextRank.color}55;"
              ></div>
            </div>
            <span class="rank-progress-label">
              {#if wpmToNext > 0}
                {wpmToNext} wpm to <span style="color:{nextRank.color}">{nextRank.piece} {nextRank.name}</span>
              {:else}
                ready for <span style="color:{nextRank.color}">{nextRank.piece} {nextRank.name}</span>
              {/if}
            </span>
          </div>
        {:else}
          <div class="rank-progress-label" style="color:{rank.color}">peak rank ✦</div>
        {/if}
      </div>
    {/if}
  </header>

  <!-- Quick stats strip — only when there's data -->
  {#if totalSessions > 0}
    <div class="stat-strip">
      <div class="sstat">
        <span class="sstat-val">{totalSessions}</span>
        <span class="sstat-label">rounds</span>
      </div>
      <div class="sstat-dot">·</div>
      <div class="sstat">
        <span class="sstat-val">{daysPlayed}</span>
        <span class="sstat-label">days</span>
      </div>
      <div class="sstat-dot">·</div>
      <div class="sstat">
        <span class="sstat-val">{layersUnlocked}/9</span>
        <span class="sstat-label">layers</span>
      </div>
      {#if bestAcc > 0}
        <div class="sstat-dot">·</div>
        <div class="sstat">
          <span class="sstat-val">{bestAcc}%</span>
          <span class="sstat-label">best acc</span>
        </div>
      {/if}
      {#if weakKey}
        <div class="sstat-dot">·</div>
        <div class="sstat">
          <span class="sstat-val sstat-weak">{weakKey.toUpperCase()}</span>
          <span class="sstat-label">weak key</span>
        </div>
      {/if}
    </div>
  {/if}

  <div class="layer-grid">
    {#each LAYERS as layer}
      {@const unlocked = !!progress.layers[layer.id]?.unlocked}
      {@const best     = progress.layers[layer.id]?.bestWpm ?? 0}
      {@const attempts = progress.layers[layer.id]?.attempts ?? 0}
      <!-- svelte-ignore a11y-no-static-element-interactions -->
      <div
        class="layer-wrap"
        style="animation-delay: {layer.id * 0.05}s"
        on:mouseenter={() => hoveredLayer = layer.id}
        on:mouseleave={() => hoveredLayer = null}
      >
        <button
          class="layer-card"
          class:locked={!unlocked}
          class:completed={best >= layer.targetWpm}
          class:selected={selectedId === layer.id && unlocked}
          on:click={() => { if (!unlocked) return; selectedId = layer.id; dispatch('start', layer.id) }}
          on:mouseenter={() => { if (unlocked) selectedId = layer.id }}
          data-unlock-hint={!unlocked && layer.id > 0 ? `complete L${layer.id - 1} first` : null}
        >
          <div class="layer-num">L{layer.id}</div>
          <div class="layer-name">{layer.name}</div>
          <div class="layer-desc">{layer.description}</div>
          {#if unlocked && best > 0}
            <div class="layer-best">{best} WPM</div>
          {/if}
          {#if !unlocked}
            <div class="layer-badge layer-lock">○</div>
          {/if}
          {#if best >= layer.targetWpm}
            <div class="layer-badge layer-done">✓</div>
          {/if}
        </button>

        <!-- Reset button — visible on hover when layer has attempts -->
        {#if unlocked && attempts > 0 && hoveredLayer === layer.id}
          <button
            class="reset-trigger"
            title="Reset options"
            on:click={(e) => openResetMenu(e, layer.id)}
          >
            ↺
          </button>
        {/if}

        <!-- Reset context menu -->
        {#if resetMenuLayer === layer.id}
          <!-- svelte-ignore a11y-no-static-element-interactions -->
          <div class="reset-menu" on:click|stopPropagation>
            <button class="reset-option" on:click={(e) => doResetScores(e, layer.id)}>
              <span class="reset-option-icon">↺</span>
              <span>
                <div class="reset-option-label">clear scores</div>
                <div class="reset-option-sub">keep layer unlocked, reset WPM</div>
              </span>
            </button>
            {#if layer.id > 0}
              <button class="reset-option reset-option-danger" on:click={(e) => doResetFull(e, layer.id)}>
                <span class="reset-option-icon">⊗</span>
                <span>
                  <div class="reset-option-label">re-lock from here</div>
                  <div class="reset-option-sub">locks this + all layers after</div>
                </span>
              </button>
            {/if}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="bottom-bar">
    <div class="key-nav-hints">
      <span class="hint"><kbd>←→</kbd> select</span>
      <span class="hint-sep">·</span>
      <span class="hint"><kbd>space</kbd> start</span>
      <span class="hint-sep">·</span>
      <span class="hint"><kbd>tab</kbd> cycle</span>
    </div>

    <div class="bottom-actions">
      <button class="nav-btn daily-cta-btn" on:click={() => dispatch('daily', dailyLayerId)}>
        {hasDoneDaily ? '✓ daily' : '📅 daily'}
      </button>
      <button class="nav-btn race-btn" on:click={() => dispatch('race')}>⬇ race</button>
      <button class="nav-btn" on:click={() => dispatch('speedburst')}>⚡ burst</button>
      <button class="nav-btn" on:click={() => dispatch('stats')}>stats</button>
      <button class="nav-btn" on:click={() => dispatch('settings')}>settings</button>
      <button
        class="full-reset-btn"
        class:armed={fullResetArmed}
        on:click={armFullReset}
      >
        {fullResetArmed ? 'confirm reset' : 'reset all'}
      </button>
    </div>
  </div>
  <footer class="attribution">
    concept &amp; design by <a href="https://github.com/hokamsingh" target="_blank" rel="noopener">hokamsingh</a>
    <span class="attr-sep">·</span>
    built with <span class="attr-stack">svelte · typescript · vite</span>
    <span class="attr-sep">·</span>
    AI pair programming by <a href="https://claude.ai" target="_blank" rel="noopener">Claude</a>
  </footer>
</div>

<style>
  .home {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 40px;
    height: 100%;
    padding: 40px;
    position: relative;
  }

  .quick-controls {
    position: absolute;
    top: 20px;
    right: 20px;
    display: flex;
    gap: 6px;
    z-index: 10;
  }

  .qc-btn {
    width: 32px;
    height: 32px;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--muted);
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    font-family: 'JetBrains Mono', monospace;
  }

  .qc-btn:hover {
    color: var(--text);
    border-color: var(--muted);
    background: var(--bg);
  }

  .home-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    animation: fade-up 0.5s ease both;
  }

  /* ambient glow spotlight behind logo */
  .home-header::before {
    content: '';
    position: absolute;
    top: -40px;
    left: 50%;
    transform: translateX(-50%);
    width: 320px;
    height: 160px;
    background: radial-gradient(
      ellipse at center,
      #a78bfa12 0%,
      #60a5fa08 40%,
      transparent 70%
    );
    pointer-events: none;
    filter: blur(20px);
  }

  .logo {
    font-size: 40px;
    font-weight: 700;
    letter-spacing: -0.02em;
    color: var(--text);
    display: flex;
    align-items: flex-end;
    gap: 0;
    line-height: 1.2;
    font-style: italic;
  }

  .logo-letter {
    display: inline-block;
    color: var(--text);
    border-bottom: 2px solid transparent;
    padding-bottom: 1px;
    animation-name: letter-wave;
    animation-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    will-change: transform, color, border-bottom-color;
  }

  /*
    Wave keyframes:
    0–12%   rise + color flash + underline appears
    12–22%  hold at peak
    22–34%  settle back, color drains to base
    34–100% rest (idle until next cycle)
  */
  /*
    Active window = 0%→8% = 0.72s at 9s duration.
    Step = 0.8s > 0.72s → only one letter moves at a time.
    Rise 0→3%, hold 3→5.5%, settle 5.5→8%, idle 8→100%.
  */
  @keyframes letter-wave {
    0%, 100% {
      transform: translateY(0);
      color: var(--text);
      border-bottom-color: transparent;
    }
    3% {
      transform: translateY(-7px);
      color: var(--flash);
      border-bottom-color: var(--flash);
    }
    5.5% {
      transform: translateY(-7px);
      color: var(--flash);
      border-bottom-color: var(--flash);
    }
    8% {
      transform: translateY(0);
      color: var(--text);
      border-bottom-color: transparent;
    }
  }

  .tagline {
    font-size: 14px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .rank-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-top: 8px;
  }

  .rank-display {
    font-size: 18px;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .rank-piece-icon { font-size: 20px; }
  .rank-name-text  { letter-spacing: 0.06em; text-transform: uppercase; }

  .rank-wpm {
    font-size: 12px;
    opacity: 0.55;
    font-weight: 400;
    margin-left: 2px;
  }

  .rank-progress-row {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    width: 100%;
    max-width: 260px;
  }

  .rank-bar-home {
    width: 100%;
    height: 3px;
    background: var(--border);
    border-radius: 2px;
    overflow: hidden;
  }

  .rank-bar-fill-home {
    height: 100%;
    border-radius: 2px;
    transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .rank-progress-label {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.04em;
  }

  /* Quick stat strip */
  .stat-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: 'JetBrains Mono', monospace;
    padding: 8px 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
  }

  .sstat {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .sstat-val {
    font-size: 15px;
    font-weight: 600;
    color: var(--muted);
    font-variant-numeric: tabular-nums;
  }

  .sstat-weak {
    color: #f97316;
  }

  .sstat-label {
    font-size: 9px;
    color: var(--border);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .sstat-dot {
    color: var(--border);
    font-size: 14px;
  }

  .layer-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    max-width: 800px;
    width: 100%;
  }

  .layer-wrap {
    position: relative;
  }

  .layer-card {
    width: 100%;
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
    text-align: left;
    cursor: pointer;
    transition:
      border-color 0.2s,
      background 0.2s,
      transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
      box-shadow 0.25s ease;
    font-family: 'JetBrains Mono', monospace;
    color: var(--text);
    transform-style: preserve-3d;
    will-change: transform;
  }

  .layer-card:hover:not(.locked) {
    border-color: var(--border);
    background: var(--surface);
    transform: perspective(600px) rotateX(-3deg) translateY(-4px);
    box-shadow:
      0 16px 40px #00000020,
      0 0 0 1px var(--border),
      inset 0 1px 0 #ffffff08;
  }

  /* Locked base state */
  .layer-card.locked {
    opacity: 0.45;
    cursor: default;
    overflow: hidden;
    transition: opacity 0.3s, border-color 0.3s, box-shadow 0.3s;
  }

  /* Shimmer pseudo-element — sits above card content, below badge */
  .layer-card.locked::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 8px;
    background: linear-gradient(
      108deg,
      transparent 20%,
      rgba(139, 92, 246, 0.04) 35%,
      rgba(167, 139, 250, 0.12) 50%,
      rgba(139, 92, 246, 0.04) 65%,
      transparent 80%
    );
    transform: translateX(-110%);
    pointer-events: none;
    z-index: 1;
  }

  /* Hover: lift opacity + glow border + trigger shimmer */
  .layer-card.locked:hover {
    opacity: 0.72;
    border-color: #7c3aed88;
    box-shadow:
      0 0 0 1px #7c3aed22,
      0 0 16px 2px #7c3aed18,
      inset 0 0 12px 0 #7c3aed0a;
  }

  .layer-card.locked:hover::before {
    animation: shimmer-sweep 0.65s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  }

  @keyframes shimmer-sweep {
    from { transform: translateX(-110%); }
    to   { transform: translateX(110%); }
  }

  /* Lock badge pulse on hover */
  .layer-card.locked:hover .layer-lock {
    color: #a78bfa;
    transform: scale(1.4);
    transition: color 0.2s, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    text-shadow: 0 0 8px #7c3aedaa;
  }

  /* Unlock tooltip via CSS — appears below card */
  .layer-card.locked[data-unlock-hint]:hover::after {
    content: attr(data-unlock-hint);
    position: absolute;
    bottom: -26px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: #a78bfa;
    white-space: nowrap;
    letter-spacing: 0.06em;
    opacity: 0;
    animation: hint-fade-in 0.2s 0.15s ease-out forwards;
    pointer-events: none;
    z-index: 50;
  }

  @keyframes hint-fade-in {
    from { opacity: 0; transform: translateX(-50%) translateY(4px); }
    to   { opacity: 0.8; transform: translateX(-50%) translateY(0); }
  }

  .layer-card.selected {
    border-color: #fbbf2466;
    background: var(--surface);
    outline: none;
    box-shadow: 0 0 0 1px #fbbf2422, inset 0 1px 0 #ffffff06;
  }

  .layer-card.completed {
    border-color: #34d39930;
  }

  /* staggered entrance for layer grid */
  .layer-wrap {
    animation: fade-up 0.4s ease both;
  }

  .layer-num {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.1em;
    font-weight: 500;
  }

  .layer-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .layer-desc {
    font-size: 11px;
    color: var(--text);
    opacity: 0.55;
    margin-top: 2px;
  }

  .layer-best {
    font-size: 12px;
    color: #fbbf24;
    margin-top: 4px;
  }

  .layer-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    font-size: 13px;
  }

  .layer-lock {
    color: var(--border);
  }

  .layer-done {
    color: #34d399;
  }

  /* Reset trigger — ↺ icon top-right on hover */
  .reset-trigger {
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 10;
    transition: color 0.1s, border-color 0.1s;
    line-height: 1;
  }

  .reset-trigger:hover {
    color: var(--text);
    border-color: var(--muted);
  }

  /* Reset context menu */
  .reset-menu {
    position: absolute;
    top: calc(100% + 4px);
    right: 0;
    z-index: 100;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 4px;
    min-width: 220px;
    box-shadow: 0 8px 24px #00000030;
  }

  .reset-option {
    width: 100%;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    border: none;
    background: transparent;
    color: var(--text);
    font-family: 'JetBrains Mono', monospace;
    cursor: pointer;
    text-align: left;
    transition: background 0.1s;
  }

  .reset-option:hover {
    background: var(--border);
  }

  .reset-option-danger {
    color: #f87171;
  }

  .reset-option-icon {
    font-size: 16px;
    margin-top: 1px;
    flex-shrink: 0;
  }

  .reset-option-label {
    font-size: 13px;
    font-weight: 500;
  }

  .reset-option-sub {
    font-size: 10px;
    color: var(--muted);
    margin-top: 2px;
  }

  .reset-option-danger .reset-option-sub {
    color: #f8717166;
  }

  /* Attribution footer */
  .attribution {
    font-size: 10px;
    font-weight: 500;
    color: var(--muted);
    letter-spacing: 0.06em;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
    justify-content: center;
    padding-bottom: 4px;
  }

  .attribution a {
    color: var(--text);
    font-weight: 600;
    text-decoration: none;
    transition: opacity 0.15s;
  }

  .attribution a:hover {
    opacity: 0.7;
  }

  .attr-sep { opacity: 0.35; }

  .attr-stack {
    color: var(--muted);
    letter-spacing: 0.04em;
  }

  /* Bottom bar */
  .streak-badge {
    font-size: 12px;
    color: #f97316;
    letter-spacing: 0.04em;
    margin-top: 4px;
  }

  .bottom-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    max-width: 800px;
  }

  .bottom-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .nav-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 5px 12px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: 0.04em;
  }

  .nav-btn:hover {
    color: var(--text);
    border-color: var(--muted);
  }

  .race-btn {
    color: #f97316;
    border-color: #f9731640;
  }

  .race-btn:hover {
    color: #fb923c;
    border-color: #f97316;
    background: #f9731610;
  }

  .daily-cta-btn {
    color: #fbbf24;
    border-color: #fbbf2440;
  }

  .daily-cta-btn:hover {
    color: #fcd34d;
    border-color: #fbbf24;
    background: #fbbf2410;
  }

  .key-nav-hints {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--muted);
  }

  .hint {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .hint-sep { opacity: 0.3; }

  kbd {
    display: inline-block;
    padding: 1px 5px;
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 10px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    background: var(--surface);
  }

  .full-reset-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--border);
    background: transparent;
    border: 1px solid transparent;
    padding: 4px 10px;
    border-radius: 4px;
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
    letter-spacing: 0.05em;
  }

  .full-reset-btn:hover {
    color: var(--muted);
    border-color: var(--border);
  }

  .full-reset-btn.armed {
    color: #f87171;
    border-color: #f8717166;
    animation: pulse-red 0.5s ease-in-out infinite alternate;
  }

  @keyframes pulse-red {
    from { border-color: #f8717166; }
    to   { border-color: #f87171cc; }
  }
</style>
