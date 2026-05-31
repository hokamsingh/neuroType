<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import { pickWord, FALL_SPEEDS, SPAWN_RATES } from './words'
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
    x: number           // % left offset
    duration: number    // CSS animation ms
    typed: number
    done: boolean
  }

  let words: FallingWord[] = []
  let idSeq      = 0
  let hp         = 3
  let score      = 0
  let started    = false
  let gameOver   = false
  let correctKeys = 0
  let wrongKeys   = 0
  let startTs    = 0
  let liveWpm    = 0
  let wrongFlash = false  // flash on wrong key

  let spawnTimer: ReturnType<typeof setInterval>
  let wpmTimer  : ReturnType<typeof setInterval>

  // Active = first non-done word (they fall in spawn order, so first = earliest/lowest)
  $: activeWord = words.filter(w => !w.done)[0] ?? null

  function spawnWord() {
    words = [...words, {
      id:       idSeq++,
      text:     pickWord(difficulty),
      x:        8 + Math.random() * 60,
      duration: FALL_SPEEDS[difficulty] + (Math.random() - 0.5) * 2000,
      typed:    0,
      done:     false,
    }]
  }

  function wordReachedBottom(id: number) {
    if (gameOver) return
    // check if this word was completed before hitting bottom
    const w = words.find(w => w.id === id)
    if (!w || w.done) return
    // word missed
    words = words.filter(w => w.id !== id)
    hp--
    sounds.wrongKey()
    if (hp <= 0) endGame()
  }

  function startGame() {
    started = true
    startTs = Date.now()
    spawnWord()
    spawnTimer = setInterval(spawnWord, SPAWN_RATES[difficulty])
    wpmTimer   = setInterval(() => {
      if (!started || gameOver) return
      const mins = (Date.now() - startTs) / 60000
      liveWpm = mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
    }, 500)
  }

  function endGame() {
    gameOver = true
    clearInterval(spawnTimer)
    clearInterval(wpmTimer)
    sounds.lessonComplete()
    const mins = (Date.now() - startTs) / 60000
    const wpm  = mins > 0 ? Math.round((correctKeys / 5) / mins) : 0
    const tot  = correctKeys + wrongKeys
    const acc  = tot > 0 ? Math.round((correctKeys / tot) * 100) : 0
    setTimeout(() => dispatch('done', { score, wpm, accuracy: acc }), 1200)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('home'); return }
    if (gameOver) return
    const key = e.key === 'Space' ? ' ' : e.key
    if (key.length > 1) return
    e.preventDefault()

    if (!started) startGame()
    if (!activeWord) return

    const expected = activeWord.text[activeWord.typed]

    if (key === expected) {
      correctKeys++
      sounds.correctKey()
      const newTyped = activeWord.typed + 1
      const complete = newTyped >= activeWord.text.length

      if (complete) {
        words = words.map(w => w.id === activeWord!.id ? { ...w, typed: newTyped, done: true } : w)
        // remove done word after a brief flash
        setTimeout(() => {
          words = words.filter(w => w.id !== activeWord!.id)
        }, 200)
        score++
        sounds.streak10()
      } else {
        words = words.map(w => w.id === activeWord!.id ? { ...w, typed: newTyped } : w)
      }
    } else {
      wrongKeys++
      wrongFlash = true
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
  const R      = 48
  const MAX_WPM = 120
  const SWEEP  = 220

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

  <button class="quit-btn" on:click={() => dispatch('home')}>✕ quit</button>
</div>

<!-- Falling words arena -->
<div class="arena">
  <!-- Deadline line at bottom -->
  <div class="deadline"></div>

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

  .speedo-box {
    width: 120px;
    margin-left: auto;
  }

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

  .deadline {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: #f8717122;
    border-top: 1px dashed #f8717144;
  }

  /* Falling words — CSS animation drives the fall */
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
</style>
