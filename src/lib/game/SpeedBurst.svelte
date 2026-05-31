<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import KeyboardMap from '../keyboard/KeyboardMap.svelte'
  import { createEngine, handleKeyPress, computeResult } from '../lessons/LessonEngine'
  import type { RoundResult } from '../lessons/LessonEngine'
  import { getKeyDef, getAnchorKeys, HOME_ANCHOR_KEYS, FINGER_HOME_KEY } from '../keyboard/layout'
  import { LAYERS, generateRound } from '../lessons/patterns'
  import { loadProgress, getWeakKeys } from '../lessons/progress'

  const dispatch = createEventDispatcher<{ done: RoundResult; home: void }>()
  export let isMobile: boolean = false

  const DURATION = 10  // seconds
  let timeLeft = DURATION
  let started  = false
  let finished = false

  // Use layer 7 (free flow) for speed burst
  const layer    = LAYERS.find(l => l.id === 7) ?? LAYERS[0]
  const weakKeys = new Set(getWeakKeys(loadProgress()))

  // Generate a long sequence
  let sequence = generateRound(layer, weakKeys, 12)
  let engine   = createEngine(sequence)

  let flashKey: string | null = null
  let flashCorrect = true
  let timer: ReturnType<typeof setInterval>

  $: currentKey    = finished ? null : (engine.sequence[engine.index] ?? null)
  $: currentKeyDef = currentKey ? getKeyDef(currentKey) : null
  $: fingerColor   = currentKeyDef ? `var(--finger-${currentKeyDef.finger})` : '#374151'

  function startTimer() {
    if (started) return
    started = true
    timer = setInterval(() => {
      timeLeft--
      if (timeLeft <= 0) {
        clearInterval(timer)
        finished = true
        const result = computeResult(engine)
        setTimeout(() => dispatch('done', result), 300)
      }
    }, 1000)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('home'); return }
    if (finished) return
    if (e.key.length > 1 && e.key !== ' ') return
    e.preventDefault()

    if (!started) startTimer()

    const pressed = e.key === 'Space' ? ' ' : e.key
    const { state, correct } = handleKeyPress(engine, pressed)
    engine = state

    flashKey = engine.sequence[engine.index - 1] ?? pressed
    flashCorrect = correct
    setTimeout(() => { flashKey = null }, 150)

    // Extend sequence if getting near the end
    if (!finished && engine.index >= engine.sequence.length - 5) {
      const more = generateRound(layer, weakKeys, 4)
      engine = { ...engine, sequence: [...engine.sequence, ...more] }
    }
  }

  // Mobile soft-keyboard
  let hiddenInput: HTMLInputElement | null = null
  let mobileKbActive = false

  function activateMobileKb() {
    hiddenInput?.focus()
    mobileKbActive = !!document.activeElement && document.activeElement === hiddenInput
  }

  function onMobileInput(e: Event) {
    const input = e.target as HTMLInputElement
    const val = input.value
    if (!val) return
    const char = val[val.length - 1]
    input.value = ''
    onKeyDown(new KeyboardEvent('keydown', { key: char, bubbles: true }))
  }

  function onMobileBlur() { mobileKbActive = false }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown)
    if (isMobile) setTimeout(() => {
      hiddenInput?.focus()
      mobileKbActive = !!document.activeElement && document.activeElement === hiddenInput
    }, 100)
  })
  onDestroy(() => {
    window.removeEventListener('keydown', onKeyDown)
    clearInterval(timer)
  })

  $: timerColor = timeLeft <= 3 ? '#f87171' : timeLeft <= 5 ? '#f97316' : '#e2e8f0'
  $: timerPct   = (timeLeft / DURATION) * 100
</script>

{#if isMobile}
  <!-- svelte-ignore a11y-autofocus -->
  <input
    bind:this={hiddenInput}
    class="hidden-kbd-input"
    type="text"
    inputmode="text"
    autocomplete="off"
    autocorrect="off"
    autocapitalize="off"
    spellcheck={false}
    on:input={onMobileInput}
    on:blur={onMobileBlur}
  />
{/if}

<!-- Timer bar -->
<div class="burst-bar">
  <div class="burst-fill" style="width:{timerPct}%; background:{timerColor}; box-shadow: 0 0 8px {timerColor};"></div>
</div>

<div class="burst-zone">
  <div class="burst-header">
    <div class="burst-label">speed burst</div>
    <div class="burst-timer" style="color:{timerColor}">
      {timeLeft}<span class="burst-s">s</span>
    </div>
  </div>

  {#if !started}
    <div class="burst-prompt">start typing to begin</div>
  {/if}

  <div class="target-area">
    {#if finished}
      <div class="done-glyph" style="color:#34d399; filter: drop-shadow(0 0 20px #34d39966)">✓</div>
    {:else if currentKey}
      {#key engine.index}
        <div class="target-key target-pop" style="color:{fingerColor}; text-shadow: 0 0 40px {fingerColor}44">
          {currentKey === ' ' ? '⎵' : currentKey.toUpperCase()}
        </div>
      {/key}
    {/if}
  </div>

  <div class="burst-stats">
    <span class="bstat">{engine.correctCount} <small>keys</small></span>
    <span class="bstat-sep">·</span>
    <span class="bstat" style={engine.wrongCount > 0 ? 'color:#f87171' : ''}>{engine.wrongCount} <small>errors</small></span>
    <span class="bstat-sep">·</span>
    <span class="bstat" style={engine.streak >= 10 ? 'color:#34d399' : ''}>{engine.streak} <small>streak</small></span>
  </div>

  <div class="burst-seq">
    {#each engine.sequence.slice(Math.max(0, engine.index - 3), engine.index + 12) as char, i}
      {@const abs = i + Math.max(0, engine.index - 3)}
      <span
        class="bchar"
        class:bchar-done={abs < engine.index}
        class:bchar-active={abs === engine.index}
      >{char === ' ' ? '·' : char}</span>
    {/each}
  </div>

  <div class="keyboard-section">
    {#if isMobile}
      <div class="mobile-controls">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="mobile-back-btn" on:click={() => dispatch('home')}>← home</div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="mobile-kbd-btn" class:active={mobileKbActive} on:click={activateMobileKb}>
          {mobileKbActive ? '⌨ keyboard active' : '⌨ tap to type'}
        </div>
      </div>
    {:else}
      <div class="burst-hint"><kbd>esc</kbd> home</div>
    {/if}
    <KeyboardMap activeKey={currentKey} {flashKey} {flashCorrect} highlightFinger={currentKeyDef?.finger ?? null} />
  </div>

  {#if !isMobile}
    <div class="burst-hint"><kbd>esc</kbd> home</div>
  {/if}
</div>

<style>
  .burst-bar {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--border);
    z-index: 100;
  }

  .burst-fill {
    height: 100%;
    transition: width 1s linear, background 0.3s;
  }

  .burst-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    height: 100%;
    padding: 32px 20px 20px;
  }

  .burst-header {
    display: flex;
    align-items: baseline;
    gap: 16px;
  }

  .burst-label {
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--muted);
  }

  .burst-timer {
    font-size: 48px;
    font-weight: 700;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    transition: color 0.3s;
  }

  .burst-s { font-size: 20px; margin-left: 2px; opacity: 0.6; }

  .burst-prompt {
    font-size: 13px;
    color: var(--muted);
    letter-spacing: 0.06em;
  }

  .target-area {
    min-height: 110px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .target-key {
    font-size: 80px;
    font-weight: 700;
    line-height: 1;
    font-family: 'JetBrains Mono', monospace;
    user-select: none;
  }

  .target-pop { animation: key-pop 0.1s cubic-bezier(0.34, 1.56, 0.64, 1) both; }

  @keyframes key-pop {
    from { opacity: 0; transform: scale(0.72); }
    to   { opacity: 1; transform: scale(1); }
  }

  .done-glyph { font-size: 72px; }

  .burst-stats {
    display: flex;
    gap: 10px;
    align-items: center;
    font-size: 14px;
    color: var(--muted);
  }

  .bstat { font-weight: 600; }
  .bstat small { font-size: 10px; color: var(--muted); margin-left: 2px; }
  .bstat-sep { color: var(--border); }

  .burst-seq {
    display: flex;
    gap: 4px;
    min-height: 28px;
  }

  .bchar {
    font-size: 16px;
    color: var(--muted);
    opacity: 0.5;
    font-family: 'JetBrains Mono', monospace;
  }

  .bchar-done   { color: var(--muted); opacity: 0.25; }
  .bchar-active { font-weight: 700; font-size: 20px; opacity: 1; color: var(--text); }

  .keyboard-section { margin-top: auto; }

  .mobile-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    justify-content: center;
  }

  .mobile-back-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.06em;
    color: var(--muted);
    padding: 8px 14px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
    cursor: pointer;
    user-select: none;
    opacity: 0.75;
  }

  .mobile-kbd-btn {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: var(--text);
    border: 1px solid #fbbf2466;
    border-radius: 8px;
    padding: 8px 20px;
    cursor: pointer;
    background: var(--surface);
    user-select: none;
    box-shadow: 0 0 12px #fbbf2418;
    transition: color 0.15s, border-color 0.15s, box-shadow 0.15s;
  }

  .mobile-kbd-btn.active {
    color: #fbbf24;
    border-color: #fbbf24;
    box-shadow: 0 0 16px #fbbf2430;
  }

  .hidden-kbd-input {
    position: fixed;
    top: -100px; left: 0;
    width: 1px; height: 1px;
    opacity: 0; pointer-events: none;
    font-size: 16px;
    border: none; outline: none;
    background: transparent; color: transparent;
  }

  @media (max-width: 640px) {
    .burst-zone {
      padding: 52px 10px 12px;
      height: 100dvh;
      overflow: hidden;
    }
    .keyboard-section { margin-top: auto; }
  }

  .burst-hint {
    font-size: 11px;
    color: var(--border);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  kbd {
    font-size: 9px;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 4px;
    color: var(--muted);
    background: var(--surface);
  }
</style>
