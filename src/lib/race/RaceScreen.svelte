<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import { makeWordQueue, FALL_SPEEDS, SPAWN_RATES } from './words'
  import type { Difficulty } from './words'
  import { sounds } from '../audio/sounds'

  export let difficulty: Difficulty = 'medium'

  const dispatch = createEventDispatcher<{
    done: { score: number; wpm: number; accuracy: number }
    home: void
  }>()

  interface FallingWord {
    id: number
    text: string
    x: number
    duration: number
    typed: number
    done: boolean
  }

  const wordQueue = makeWordQueue(difficulty)

  let words: FallingWord[]  = []
  let idSeq         = 0
  let hp            = 3
  let score         = 0
  let started       = false
  let gameOver      = false
  let paused        = false
  let showQuitModal = false
  let showBreathe   = false
  let correctKeys   = 0
  let wrongKeys     = 0
  let startTs       = 0
  let totalPausedMs = 0
  let pauseStartTs  = 0
  let liveWpm       = 0
  let wrongFlash    = false

  // ── Rage ──────────────────────────────────────────────────
  let rage          = 0   // 0–100
  let shaking       = false

  const BREATHE_MSGS = [
    "hey. breathe. it's just a keyboard.",
    "your keyboard didn't mean it.",
    "inhale. exhale. try again.",
    "slow down. you're doing fine.",
    "the keys aren't judging you.",
    "step back. reset. come back stronger.",
  ]
  let breatheMsg = BREATHE_MSGS[0]

  function addRage(n: number) {
    rage = Math.min(100, Math.max(0, rage + n))
    if (rage >= 70 && !showBreathe && !showQuitModal && !gameOver) {
      triggerBreathe()
    } else if (rage >= 50 && !shaking) {
      shaking = true
      setTimeout(() => { shaking = false }, 500)
    }
  }

  function triggerBreathe() {
    breatheMsg = BREATHE_MSGS[Math.floor(Math.random() * BREATHE_MSGS.length)]
    pauseGame()
    showBreathe = true
  }

  function closeBreathe() {
    showBreathe = false
    rage = 30
    if (hp <= 0) { endGame(); return }
    resumeGame()
  }

  function restartFromBreathe() {
    showBreathe = false
    dispatch('home')
  }

  $: rageColor = rage < 30 ? '#34d399' : rage < 55 ? '#fbbf24' : rage < 70 ? '#f97316' : '#f87171'
  $: rageLabel = rage < 30 ? 'chill' : rage < 55 ? 'tilting' : rage < 70 ? 'raging' : '🔥 MAX'

  // ── Timers ─────────────────────────────────────────────────
  let spawnTimer: ReturnType<typeof setInterval>
  let wpmTimer  : ReturnType<typeof setInterval>

  $: activeWord = words.filter(w => !w.done)[0] ?? null

  function activeMins() {
    const paused_so_far = paused ? totalPausedMs + (Date.now() - pauseStartTs) : totalPausedMs
    return (Date.now() - startTs - paused_so_far) / 60000
  }

  function spawnWord() {
    words = [...words, {
      id:       idSeq++,
      text:     wordQueue.next(),
      x:        8 + Math.random() * 60,
      duration: FALL_SPEEDS[difficulty] + (Math.random() - 0.5) * 2000,
      typed:    0,
      done:     false,
    }]
  }

  function wordReachedBottom(id: number) {
    if (gameOver || paused) return
    const w = words.find(w => w.id === id)
    if (!w || w.done) return
    words = words.filter(w => w.id !== id)
    hp--
    sounds.wrongKey()
    addRage(20)
    // if breathe modal just triggered, don't end game — let user recover first
    if (hp <= 0 && !showBreathe) endGame()
  }

  function startGame() {
    started = true
    startTs = Date.now()
    spawnWord()
    spawnTimer = setInterval(spawnWord, SPAWN_RATES[difficulty])
    wpmTimer   = setInterval(() => {
      if (!started || gameOver || paused) return
      const mins = activeMins()
      liveWpm = mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
    }, 500)
  }

  function endGame() {
    gameOver = true
    if (paused) resumeGame()
    clearInterval(spawnTimer)
    clearInterval(wpmTimer)
    sounds.lessonComplete()
    const mins = activeMins()
    const wpm  = mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
    const tot  = correctKeys + wrongKeys
    const acc  = tot > 0 ? Math.round((correctKeys / tot) * 100) : 0
    setTimeout(() => dispatch('done', { score, wpm, accuracy: acc }), 1200)
  }

  function pauseGame() {
    if (!started || gameOver || paused) return
    paused = true
    pauseStartTs = Date.now()
    clearInterval(spawnTimer)
    clearInterval(wpmTimer)
  }

  function resumeGame() {
    if (!paused) return
    totalPausedMs += Date.now() - pauseStartTs
    paused = false
    spawnTimer = setInterval(spawnWord, SPAWN_RATES[difficulty])
    wpmTimer   = setInterval(() => {
      if (!started || gameOver || paused) return
      const mins = activeMins()
      liveWpm = mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
    }, 500)
  }

  function togglePause() {
    if (paused) resumeGame()
    else pauseGame()
  }

  function openQuitModal() {
    if (started && !gameOver) pauseGame()
    showQuitModal = true
  }

  function closeQuitModal() {
    showQuitModal = false
    if (started && !gameOver) resumeGame()
  }

  function confirmQuit() {
    showQuitModal = false
    dispatch('home')
  }

  $: quitWpm = (() => {
    if (!started) return 0
    const mins = activeMins()
    return mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
  })()

  $: quitAcc = (() => {
    const tot = correctKeys + wrongKeys
    return tot > 0 ? Math.round((correctKeys / tot) * 100) : 0
  })()

  function onKeyDown(e: KeyboardEvent) {
    if (showBreathe) {
      if (e.key === 'Escape') { e.preventDefault(); closeBreathe() }
      return
    }
    if (showQuitModal) {
      if (e.key === 'Escape') { e.preventDefault(); closeQuitModal() }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); openQuitModal(); return }
    if (e.key === 'F9' || (e.key === 'p' && e.ctrlKey)) { e.preventDefault(); togglePause(); return }
    if (gameOver || paused) return
    const key = e.key === 'Space' ? ' ' : e.key
    if (key.length > 1) return
    e.preventDefault()

    if (!started) startGame()
    if (!activeWord) return

    const expected = activeWord.text[activeWord.typed]

    if (key === expected) {
      correctKeys++
      sounds.correctKey()
      addRage(-1)
      const newTyped = activeWord.typed + 1
      const complete = newTyped >= activeWord.text.length

      if (complete) {
        words = words.map(w => w.id === activeWord!.id ? { ...w, typed: newTyped, done: true } : w)
        setTimeout(() => {
          words = words.filter(w => w.id !== activeWord!.id)
        }, 200)
        score++
        addRage(-10)
        sounds.streak10()
      } else {
        words = words.map(w => w.id === activeWord!.id ? { ...w, typed: newTyped } : w)
      }
    } else {
      wrongKeys++
      wrongFlash = true
      addRage(8)
      setTimeout(() => { wrongFlash = false }, 160)
      sounds.wrongKey()
    }
  }

  onMount(() => window.addEventListener('keydown', onKeyDown))
  onDestroy(() => {
    window.removeEventListener('keydown', onKeyDown)
    clearInterval(spawnTimer)
    clearInterval(wpmTimer)
  })

  // ── Speedometer ───────────────────────────────────────────
  const R       = 48
  const MAX_WPM = 120
  const SWEEP   = 220

  function angle(wpm: number): number {
    return -110 + (Math.min(wpm, MAX_WPM) / MAX_WPM) * SWEEP
  }

  function px(deg: number, r: number): number { return 60 + r * Math.cos(deg * Math.PI / 180) }
  function py(deg: number, r: number): number { return 64 + r * Math.sin(deg * Math.PI / 180) }

  function speedColor(wpm: number): string {
    if (wpm < 30) return '#60a5fa'
    if (wpm < 50) return '#34d399'
    if (wpm < 70) return '#fbbf24'
    if (wpm < 90) return '#f97316'
    return '#f87171'
  }

  $: needle = angle(liveWpm)
  $: sc     = speedColor(liveWpm)
</script>

<!-- HUD -->
<div class="hud">
  <div class="hp">
    {#each Array(3) as _, i}
      <span class="heart" class:lost={i >= hp}>♥</span>
    {/each}
  </div>

  <div class="score-display">
    <span class="score-num">{score}</span>
    <span class="score-label">words</span>
  </div>

  <!-- Rage meter -->
  {#if started && !gameOver}
    <div class="rage-wrap" title="rage meter">
      <div class="rage-label" style="color:{rageColor}">{rageLabel}</div>
      <div class="rage-track">
        <div
          class="rage-fill"
          style="width:{rage}%; background:{rageColor}; box-shadow: 0 0 6px {rageColor}88"
        ></div>
      </div>
    </div>
  {/if}

  <!-- Speedometer SVG -->
  <div class="speedo-box">
    <svg viewBox="0 0 120 80" xmlns="http://www.w3.org/2000/svg">
      <path d="M {px(-110,R)} {py(-110,R)} A {R} {R} 0 1 1 {px(110,R)} {py(110,R)}"
        fill="none" stroke="#1e1e28" stroke-width="5" stroke-linecap="round"/>
      {#if liveWpm > 0}
        <path d="M {px(-110,R)} {py(-110,R)} A {R} {R} 0 {(needle+110)>180?1:0} 1 {px(needle,R)} {py(needle,R)}"
          fill="none" stroke="{sc}" stroke-width="5" stroke-linecap="round"
          style="filter:drop-shadow(0 0 4px {sc}88)"/>
      {/if}
      <line x1="60" y1="64" x2="{px(needle,R-10)}" y2="{py(needle,R-10)}"
        stroke="{sc}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="60" cy="64" r="4" fill="{sc}"/>
      <text x="60" y="55" text-anchor="middle" font-size="13" font-weight="700"
        fill="{sc}" font-family="JetBrains Mono,monospace">{liveWpm}</text>
      <text x="60" y="74" text-anchor="middle" font-size="7"
        fill="#374151" font-family="JetBrains Mono,monospace">WPM</text>
    </svg>
  </div>

  {#if started && !gameOver}
    <button class="pause-btn" on:click={togglePause} title="Pause / Resume (F9)">
      {paused ? '▶' : '⏸'}
    </button>
  {/if}

  <button class="quit-btn" on:click={openQuitModal}>✕ quit</button>
</div>

<!-- Falling words arena -->
<div class="arena" class:arena-paused={paused} class:arena-shake={shaking}
  style="--rage-tint: {rage > 60 ? Math.round((rage - 60) / 40 * 18) : 0}">
  <div class="deadline"></div>

  <!-- red vignette at high rage -->
  {#if rage > 60}
    <div class="rage-vignette" style="opacity:{((rage - 60) / 40) * 0.35}"></div>
  {/if}

  {#each words as word (word.id)}
    {@const isActive = activeWord?.id === word.id}
    <div
      class="word"
      class:active={isActive}
      class:word-done={word.done}
      style="left:{word.x}%; animation-duration:{word.duration}ms"
      on:animationend={() => wordReachedBottom(word.id)}
    >
      <span class="typed">{word.text.slice(0, word.typed)}</span>{#if isActive && !word.done}<span class="next">{word.text[word.typed] ?? ''}</span><span class="rest">{word.text.slice(word.typed + 1)}</span>{:else}<span class="rest-dim">{word.text.slice(word.typed)}</span>{/if}
    </div>
  {/each}

  {#if !started}
    <div class="start-msg">start typing to begin</div>
  {/if}

  {#if paused && !showBreathe}
    <div class="pause-overlay">
      <div class="pause-icon">⏸</div>
      <div class="pause-label">paused</div>
      <div class="pause-hint">press F9 or click ▶ to resume</div>
    </div>
  {/if}

  {#if gameOver}
    <div class="gameover">
      <div class="go-piece">♟</div>
      <div class="go-score">{score}</div>
      <div class="go-label">words typed</div>
    </div>
  {/if}
</div>

<!-- Active word strip at bottom -->
{#if activeWord && started && !gameOver}
  <div class="active-strip" class:wrong-flash={wrongFlash}>
    <span class="as-typed">{activeWord.text.slice(0, activeWord.typed)}</span><span class="as-next">{activeWord.text[activeWord.typed] ?? ''}</span><span class="as-rest">{activeWord.text.slice(activeWord.typed + 1)}</span>
  </div>
{/if}

<!-- Breathe modal -->
{#if showBreathe}
  <div class="breathe-backdrop">
    <div class="breathe-modal">
      <div class="breathe-circle"></div>
      <div class="breathe-msg">{breatheMsg}</div>
      <div class="breathe-hint">close your eyes. breathe in 4s, out 4s.</div>
      <div class="breathe-actions">
        <button class="btn-calm" on:click={closeBreathe}>i'm calm, resume</button>
        <button class="btn-restart" on:click={restartFromBreathe}>just restart</button>
      </div>
    </div>
  </div>
{/if}

<!-- Quit modal -->
{#if showQuitModal}
  <div class="modal-backdrop" on:click={closeQuitModal}>
    <div class="modal" on:click|stopPropagation>
      <div class="modal-title">race summary</div>

      <div class="modal-stats">
        <div class="stat-row">
          <span class="stat-label">words</span>
          <span class="stat-val">{score}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">wpm</span>
          <span class="stat-val">{quitWpm}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">accuracy</span>
          <span class="stat-val">{quitAcc}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">difficulty</span>
          <span class="stat-val">{difficulty}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">lives left</span>
          <span class="stat-val">{hp} / 3</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">rage</span>
          <span class="stat-val" style="color:{rageColor}">{rage}%</span>
        </div>
      </div>

      <div class="modal-actions">
        {#if !gameOver}
          <button class="btn-resume" on:click={closeQuitModal}>▶ resume</button>
        {/if}
        <button class="btn-exit" on:click={confirmQuit}>exit to home</button>
      </div>
    </div>
  </div>
{/if}

<style>
  /* HUD bar */
  .hud {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 56px;
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 0 20px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .hp { display: flex; gap: 6px; }

  .heart {
    font-size: 20px;
    color: #f87171;
    transition: opacity 0.3s, color 0.3s;
    user-select: none;
  }

  .heart.lost { color: var(--border); opacity: 0.3; }

  .score-display {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .score-num {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .score-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; }

  /* Rage meter */
  .rage-wrap {
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 80px;
  }

  .rage-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 700;
    transition: color 0.3s;
  }

  .rage-track {
    width: 80px;
    height: 4px;
    background: var(--surface);
    border-radius: 2px;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  .rage-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 0.2s ease, background 0.3s ease, box-shadow 0.3s ease;
  }

  .speedo-box {
    width: 120px;
    margin-left: auto;
  }

  .pause-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 5px 10px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
    line-height: 1;
  }

  .pause-btn:hover { color: #fbbf24; border-color: #fbbf2460; }

  .quit-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: var(--muted);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 5px 12px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s;
    letter-spacing: 0.04em;
    flex-shrink: 0;
  }

  .quit-btn:hover { color: #f87171; border-color: #f8717160; }

  /* Arena */
  .arena {
    position: fixed;
    top: 56px; left: 0; right: 0; bottom: 60px;
    overflow: hidden;
  }

  .arena-paused .word { animation-play-state: paused; }

  @keyframes shake {
    0%,100% { transform: translateX(0); }
    15%      { transform: translateX(-6px) rotate(-0.4deg); }
    30%      { transform: translateX(6px) rotate(0.4deg); }
    45%      { transform: translateX(-4px); }
    60%      { transform: translateX(4px); }
    75%      { transform: translateX(-2px); }
  }

  .arena-shake { animation: shake 0.5s ease both; }

  .rage-vignette {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(ellipse at center, transparent 40%, #f8717180 100%);
    transition: opacity 0.4s ease;
    z-index: 1;
  }

  .deadline {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: #f8717122;
    border-top: 1px dashed #f8717144;
  }

  /* Falling words */
  .word {
    position: absolute;
    top: -6%;
    transform: translateX(-50%);
    font-family: 'JetBrains Mono', monospace;
    font-size: 17px;
    font-weight: 500;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
    animation: fall linear forwards;
    z-index: 2;
  }

  .word.active { font-size: 21px; font-weight: 700; }

  .word.word-done {
    animation-play-state: paused;
    opacity: 0;
    transition: opacity 0.2s;
  }

  @keyframes fall {
    from { top: -6%; }
    to   { top: 106%; }
  }

  .typed    { color: var(--border); }
  .next     { color: #fbbf24; text-decoration: underline; text-underline-offset: 4px; }
  .rest     { color: var(--text); }
  .rest-dim { color: var(--muted); }

  /* Pause overlay */
  .pause-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(0,0,0,0.55);
    backdrop-filter: blur(3px);
    z-index: 10;
  }

  .pause-icon  { font-size: 40px; color: #fbbf24; }
  .pause-label { font-size: 18px; font-weight: 700; color: var(--text); letter-spacing: 0.12em; text-transform: uppercase; }
  .pause-hint  { font-size: 11px; color: var(--muted); letter-spacing: 0.06em; }

  /* Active strip */
  .active-strip {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 26px;
    font-weight: 700;
    background: var(--bg);
    border-top: 1px solid var(--border);
    z-index: 50;
    transition: background 0.1s;
    letter-spacing: 0.03em;
  }

  .active-strip.wrong-flash { background: #f8717118; }

  .as-typed { color: var(--border); }
  .as-next  { color: #fbbf24; }
  .as-rest  { color: var(--muted); }

  .start-msg {
    position: absolute;
    top: 45%; left: 50%;
    transform: translate(-50%, -50%);
    font-size: 13px;
    color: var(--muted);
    letter-spacing: 0.08em;
  }

  .gameover {
    position: absolute;
    top: 45%; left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: fade-up 0.4s ease both;
  }

  .go-piece  { font-size: 56px; color: var(--border); }
  .go-score  { font-size: 48px; font-weight: 700; color: var(--text); line-height: 1; }
  .go-label  { font-size: 12px; color: var(--muted); letter-spacing: 0.1em; text-transform: uppercase; }

  /* Breathe modal */
  .breathe-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(8px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 300;
  }

  .breathe-modal {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    font-family: 'JetBrains Mono', monospace;
    padding: 40px;
  }

  /* Breathing circle — 4s expand/contract cycle */
  .breathe-circle {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #60a5fa22;
    border: 2px solid #60a5fa66;
    animation: breathe-pulse 4s ease-in-out infinite;
    box-shadow: 0 0 20px #60a5fa33;
  }

  @keyframes breathe-pulse {
    0%, 100% { transform: scale(1);    box-shadow: 0 0 20px #60a5fa33; }
    50%       { transform: scale(1.5); box-shadow: 0 0 40px #60a5fa66; }
  }

  .breathe-msg {
    font-size: 16px;
    color: var(--text);
    text-align: center;
    max-width: 280px;
    line-height: 1.5;
  }

  .breathe-hint {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.06em;
    text-align: center;
  }

  .breathe-actions {
    display: flex;
    gap: 10px;
    margin-top: 8px;
  }

  .btn-calm, .btn-restart {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    border-radius: 5px;
    padding: 8px 18px;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: opacity 0.15s;
  }

  .btn-calm {
    background: #60a5fa18;
    color: #60a5fa;
    border: 1px solid #60a5fa40;
  }

  .btn-restart {
    background: #f8717118;
    color: #f87171;
    border: 1px solid #f8717140;
  }

  .btn-calm:hover, .btn-restart:hover { opacity: 0.75; }

  /* Quit modal */
  .modal-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 32px 40px;
    min-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    font-family: 'JetBrains Mono', monospace;
  }

  .modal-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .modal-stats { display: flex; flex-direction: column; gap: 10px; }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }

  .stat-label { font-size: 12px; color: var(--muted); letter-spacing: 0.06em; }

  .stat-val {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .modal-actions { display: flex; gap: 10px; }

  .btn-resume, .btn-exit {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    border-radius: 5px;
    padding: 8px 18px;
    cursor: pointer;
    letter-spacing: 0.04em;
    flex: 1;
    transition: opacity 0.15s;
  }

  .btn-resume {
    background: #fbbf2418;
    color: #fbbf24;
    border: 1px solid #fbbf2440;
  }

  .btn-resume:hover { opacity: 0.8; }

  .btn-exit {
    background: #f8717118;
    color: #f87171;
    border: 1px solid #f8717140;
  }

  .btn-exit:hover { opacity: 0.8; }
</style>
