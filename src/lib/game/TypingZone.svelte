<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte'
  import KeyboardMap from '../keyboard/KeyboardMap.svelte'
  import { createEngine, handleKeyPress, computeResult } from '../lessons/LessonEngine'
  import type { RoundResult } from '../lessons/LessonEngine'
  import { getKeyDef, getAnchorKeys, HOME_ANCHOR_KEYS, FINGER_HOME_KEY } from '../keyboard/layout'
  import type { Finger } from '../keyboard/layout'
  import { generateRound } from '../lessons/patterns'
  import type { Layer } from '../lessons/patterns'
  import { loadProgress, getWeakKeys } from '../lessons/progress'

  export let layer: Layer
  export let isBlind: boolean = false
  export let isMobile: boolean = false
  export let wordAnnounce: boolean = false

  const dispatch = createEventDispatcher<{ done: RoundResult; home: void; retry: void }>()

  const weakKeys = new Set(getWeakKeys(loadProgress()))
  let sequence: string[] = generateRound(layer, weakKeys)
  let engine = createEngine(sequence)
  let flashKey: string | null = null
  let flashCorrect = true

  // Anchor / lift tracking
  let liftCount    = 0
  let liftWarning  = false
  let liftedKeys   = new Set<string>()

  function announceKey(key: string | null) {
    if (!wordAnnounce || !key || typeof speechSynthesis === 'undefined') return
    speechSynthesis.cancel()
    const label = key === ' ' ? 'space' : key
    speechSynthesis.speak(new SpeechSynthesisUtterance(label))
  }

  $: currentKey    = engine.done ? null : (engine.sequence[engine.index] ?? null)
  $: if (wordAnnounce) announceKey(currentKey)
  $: currentKeyDef = currentKey ? getKeyDef(currentKey) : null
  $: targetFinger  = currentKeyDef?.finger ?? null
  $: fingerColor   = targetFinger ? `var(--finger-${targetFinger})` : '#374151'
  $: progress      = engine.done ? 1 : engine.sequence.length
    ? engine.index / engine.sequence.length : 0

  // Show anchors only when reaching (non-home row target)
  $: showAnchors   = !engine.done && currentKeyDef?.row !== 'home' && currentKeyDef?.row !== 'space'
  $: anchorKeys    = showAnchors ? getAnchorKeys(targetFinger) : []

  function onKeyUp(e: KeyboardEvent) {
    const key = e.key === ';' ? ';' : e.key.toLowerCase()
    if (!HOME_ANCHOR_KEYS.has(key)) return
    if (engine.done || !currentKeyDef) return

    // only flag if we're reaching (non-home target)
    if (currentKeyDef.row === 'home' || currentKeyDef.row === 'space') return

    // the active finger's home key is allowed to lift (it's moving)
    const activeFingersHome = FINGER_HOME_KEY[currentKeyDef.finger]
    if (key === activeFingersHome) return

    // another anchor finger lifted — penalise
    liftCount++
    liftedKeys = new Set([...liftedKeys, key])
    liftWarning = true
    setTimeout(() => {
      liftedKeys = new Set([...liftedKeys].filter(k => k !== key))
      liftWarning = false
    }, 500)
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('home'); return }

    if (engine.done) {
      e.preventDefault()
      if (e.key === ' ')     dispatch('retry')
      else if (e.key === 'Enter') dispatch('done', computeResult(engine))
      return
    }

    if (e.key.length > 1 && e.key !== ' ') return
    e.preventDefault()

    const pressed = e.key === 'Space' ? ' ' : e.key
    const { state, correct } = handleKeyPress(engine, pressed)
    engine = state

    flashKey = engine.sequence[engine.index - 1] ?? pressed
    flashCorrect = correct
    setTimeout(() => { flashKey = null }, 180)

    if (state.done) {
      setTimeout(() => dispatch('done', computeResult(state)), 500)
    }
  }

  const TIPS = [
    'keep all idle fingers resting on home row',
    'rhythm matters more than speed — stay consistent',
    'look at the key on screen, not your hand',
    'reach with one finger, others stay anchored',
    'let the finger snap back to home after each press',
    'accuracy first — speed follows automatically',
    'curved fingers, not flat — rest on the pad, not tip',
    'your wrists should float, not press on the desk',
    'the wrong key costs more time than going slow',
    'mental map: every finger owns specific keys',
    'relax your shoulders — tension slows fingers',
    'home row is home base — always return',
    'think of each key as belonging to a finger, not a hand',
    'trust muscle memory — stop looking at keys',
    'hand setup: left pinky on A, ring on S, middle on D, index on F — mirror right side on JKL;',
    'try it physically: rest fingers on ASDF + JKL;, thumbs hovering above space — feel the reach zones',
  ]

  let tipIndex = Math.floor(Math.random() * TIPS.length)
  let tipVisible = true
  let tipTimer: ReturnType<typeof setInterval>

  function rotateTip() {
    tipVisible = false
    setTimeout(() => {
      tipIndex = (tipIndex + 1) % TIPS.length
      tipVisible = true
    }, 400)
  }

  // Mobile soft-keyboard support
  let hiddenInput: HTMLInputElement | null = null
  let mobileKeyboardActive = false

  function activateMobileKeyboard() {
    hiddenInput?.focus()
    mobileKeyboardActive = true
  }

  function onMobileInput(e: Event) {
    const input = e.target as HTMLInputElement
    const val = input.value
    if (!val) return
    const char = val[val.length - 1]
    input.value = ''

    if (engine.done) {
      if (char === ' ') dispatch('retry')
      return
    }

    const { state, correct } = handleKeyPress(engine, char)
    engine = state
    flashKey = engine.sequence[engine.index - 1] ?? char
    flashCorrect = correct
    setTimeout(() => { flashKey = null }, 180)
    if (state.done) setTimeout(() => dispatch('done', computeResult(state)), 500)
  }

  function onMobileKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') { dispatch('home'); return }
    if (e.key === 'Enter' && engine.done) { dispatch('done', computeResult(engine)); return }
    // Backspace when empty fires keydown but not input — treat as wrong press, ignore
  }

  function onMobileBlur() {
    mobileKeyboardActive = false
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    tipTimer = setInterval(rotateTip, 6000)
    // Try auto-focusing hidden input on mobile (works on Android; silently fails on iOS Safari without user gesture)
    if (isMobile) {
      setTimeout(() => {
        hiddenInput?.focus()
        mobileKeyboardActive = !!document.activeElement && document.activeElement === hiddenInput
      }, 100)
    }
  })
  onDestroy(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    clearInterval(tipTimer)
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  })
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
    on:keydown={onMobileKeydown}
    on:blur={onMobileBlur}
  />
{/if}

<!-- Top progress bar -->
<div class="progress-track">
  <div
    class="progress-fill"
    style="width: {progress * 100}%; background: {fingerColor}; box-shadow: 0 0 8px {fingerColor};"
  ></div>
</div>

<div class="typing-zone">
  <div class="content-group">
  <!-- Layer label -->
  <div class="layer-label">
    L{layer.id} · {layer.name}
  </div>

  <!-- Target key area with pulse rings -->
  <div class="target-area">
    {#if engine.done}
      <div class="done-state">
        <div class="done-glyph">✓</div>
        <div class="done-label">complete</div>
      </div>
    {:else if currentKey !== null}
      <div class="target-wrap">
        <!-- Sonar pulse rings, colored by current finger -->
        <span class="pulse-ring ring-1" style="border-color: {fingerColor}"></span>
        <span class="pulse-ring ring-2" style="border-color: {fingerColor}"></span>

        <!-- {#key engine.index} forces remount on every press,
             even f→f→f — each gets a fresh pop-in animation -->
        {#key engine.index}
          <div class="target-key target-key-pop" style="color: {fingerColor}; text-shadow: 0 0 40px {fingerColor}44;">
            {currentKey === ' ' ? '⎵' : currentKey.toUpperCase()}
          </div>
        {/key}
      </div>
      {#if currentKeyDef}
        {#key currentKeyDef.finger}
          <div class="finger-label" style="color: {fingerColor}">
            {currentKeyDef.finger.replace('-', ' ')}
          </div>
        {/key}
      {/if}
    {:else}
      <div class="target-key" style="color:var(--border)">·</div>
    {/if}
  </div>

  <!-- Sequence strip -->
  <div class="sequence-preview">
    {#each engine.sequence as char, i}
      {@const isActive = i === engine.index && !engine.done}
      {@const isDone   = i < engine.index}
      <span
        class="seq-char"
        class:seq-done={isDone}
        class:seq-active={isActive}
        class:seq-upcoming={i > engine.index && !engine.done}
        style={isActive && currentKeyDef ? `color: ${fingerColor}` : ''}
      >{char === ' ' ? '·' : char}</span>
    {/each}
  </div>

  <!-- Live stats -->
  <div class="stats-bar">
    <span class="stat">
      <span class="stat-label">streak</span>
      <span class="stat-val" style={engine.streak >= 10 ? 'color:#34d399' : ''}>{engine.streak}</span>
    </span>
    <span class="stat-sep">·</span>
    <span class="stat">
      <span class="stat-label">errors</span>
      <span class="stat-val" style={engine.wrongCount > 0 ? 'color:#f87171' : ''}>{engine.wrongCount}</span>
    </span>
    <span class="stat-sep">·</span>
    <span class="stat">
      <span class="stat-label">keys</span>
      <span class="stat-val">{engine.index}<span class="stat-total">/{engine.sequence.length}</span></span>
    </span>
    {#if liftCount > 0}
      <span class="stat-sep">·</span>
      <span class="stat">
        <span class="stat-label">lifts</span>
        <span class="stat-val" style="color:#f97316">{liftCount}</span>
      </span>
    {/if}
  </div>

  <!-- Rotating tip -->
  {#if !engine.done}
    <div class="tip" class:tip-visible={tipVisible}>
      <span class="tip-prefix">tip</span>
      {TIPS[tipIndex]}
    </div>
  {/if}

  <!-- Key hints -->
  <div class="key-hints">
    {#if engine.done}
      <span class="hint"><kbd>space</kbd> retry</span>
      <span class="hint-sep">·</span>
      <span class="hint"><kbd>enter</kbd> next</span>
      <span class="hint-sep">·</span>
    {/if}
    <span class="hint hint-dim"><kbd>esc</kbd> home</span>
  </div>

  <!-- Lift warning banner -->
  {#if liftWarning}
    <div class="lift-warn" aria-live="assertive">anchor — keep fingers home</div>
  {/if}

  </div><!-- end content-group -->

  <!-- Keyboard map (hidden in blind mode) -->
  <div class="keyboard-section">
    {#if isMobile}
      <div class="mobile-controls">
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div class="mobile-back-inline" on:click={() => dispatch('home')}>← home</div>
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <!-- svelte-ignore a11y-no-static-element-interactions -->
        <div
          class="tap-to-type"
          class:tap-active={mobileKeyboardActive}
          on:click={activateMobileKeyboard}
        >
          {mobileKeyboardActive ? '⌨ keyboard active' : '⌨ tap to type'}
        </div>
      </div>
    {/if}
    {#if isBlind}
      <div class="blind-placeholder">keyboard hidden — blind mode</div>
    {:else}
    <KeyboardMap
      activeKey={currentKey}
      {flashKey}
      {flashCorrect}
      highlightFinger={targetFinger}
      {anchorKeys}
      {liftedKeys}
    />
    {/if}
  </div>
</div>

<style>
  /* Progress bar — pinned to top edge */
  .progress-track {
    position: fixed;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: var(--border);
    z-index: 100;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.12s ease-out;
  }

  .typing-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 36px 20px 20px;
    height: 100%;
  }

  .layer-label {
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--muted);
    animation: fade-in 0.4s ease both;
  }

  /* ── Target area ─────────────────────────────────── */
  .target-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    min-height: 130px;
    justify-content: center;
  }

  .target-wrap {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 120px;
    height: 120px;
  }

  .target-key {
    font-size: 84px;
    font-weight: 700;
    line-height: 1;
    font-family: 'JetBrains Mono', monospace;
    transition: color 0.08s, text-shadow 0.08s;
    position: relative;
    z-index: 2;
    user-select: none;
  }

  /* Fires on every index change — even f→f→f each pops in fresh */
  .target-key-pop {
    animation: key-pop 0.12s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  @keyframes key-pop {
    from { opacity: 0; transform: scale(0.72); }
    to   { opacity: 1; transform: scale(1); }
  }

  /* Sonar pulse rings */
  .pulse-ring {
    position: absolute;
    border-radius: 50%;
    border: 1px solid;
    opacity: 0;
    animation: sonar-pulse 2.4s ease-out infinite;
    pointer-events: none;
  }

  .ring-1 { animation-delay: 0s; }
  .ring-2 { animation-delay: 1.2s; }

  @keyframes sonar-pulse {
    0%   { width: 60px;  height: 60px;  opacity: 0.5; }
    100% { width: 200px; height: 200px; opacity: 0; }
  }

  .finger-label {
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    opacity: 0.75;
    transition: color 0.08s;
  }

  /* Done state */
  .done-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    animation: fade-up 0.3s ease both;
  }

  .done-glyph {
    font-size: 72px;
    color: #34d399;
    line-height: 1;
    filter: drop-shadow(0 0 20px #34d39966);
    animation: pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .done-label {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  @keyframes pop-in {
    from { transform: scale(0.4); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }

  /* ── Sequence preview ────────────────────────────── */
  .sequence-preview {
    display: flex;
    gap: 5px;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 560px;
    min-height: 30px;
    line-height: 1;
  }

  .seq-char {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px;
    transition: color 0.08s, opacity 0.08s, font-size 0.08s, font-weight 0.08s;
    color: var(--muted);
    opacity: 0.5;
  }

  .seq-done {
    color: var(--border);
    opacity: 0.25;
  }

  .seq-active {
    font-weight: 700;
    font-size: 20px;
    opacity: 1;
  }

  .seq-upcoming {
    color: var(--muted);
    opacity: 0.45;
  }

  /* ── Stats bar ───────────────────────────────────── */
  .stats-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
  }

  .stat {
    display: flex;
    gap: 5px;
    align-items: baseline;
  }

  .stat-label {
    text-transform: uppercase;
    letter-spacing: 0.1em;
    font-size: 9px;
    color: var(--muted);
  }

  .stat-val {
    color: var(--muted);
    font-weight: 600;
    font-size: 14px;
    transition: color 0.2s;
  }

  .stat-total {
    font-size: 11px;
    color: var(--muted);
    font-weight: 400;
  }

  .stat-sep { color: var(--border); font-size: 12px; }

  /* ── Rotating tip ────────────────────────────────── */
  .tip {
    font-size: 11px;
    color: var(--muted);
    letter-spacing: 0.03em;
    max-width: 440px;
    text-align: center;
    line-height: 1.6;
    opacity: 0;
    transition: opacity 0.4s ease;
    min-height: 18px;
  }

  .tip.tip-visible { opacity: 1; }

  .tip-prefix {
    display: inline-block;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #854d0e;
    background: #fbbf2415;
    border: 1px solid #fbbf2430;
    border-radius: 3px;
    padding: 1px 6px;
    margin-right: 8px;
    vertical-align: middle;
  }

  /* ── Key hints ───────────────────────────────────── */
  .key-hints {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--muted);
    min-height: 18px;
    animation: fade-in 0.3s ease both;
  }

  .hint { display: flex; align-items: center; gap: 4px; }
  .hint-dim { opacity: 0.35; }
  .hint-sep { opacity: 0.25; }

  kbd {
    display: inline-block;
    padding: 1px 6px;
    border: 1px solid var(--border);
    border-radius: 3px;
    font-size: 9px;
    font-family: 'JetBrains Mono', monospace;
    color: var(--muted);
    background: var(--surface);
    letter-spacing: 0.04em;
  }

  .content-group {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .keyboard-section {
    flex-shrink: 0;
  }

  .blind-placeholder {
    font-size: 11px;
    color: var(--border);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 32px;
    border: 1px dashed #1e1e28;
    border-radius: 12px;
  }

  /* Lift warning banner */
  .lift-warn {
    position: fixed;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: #f97316;
    background: #f9731610;
    border: 1px solid #f9731633;
    border-radius: 4px;
    padding: 4px 14px;
    animation: warn-fade 0.5s ease both;
    pointer-events: none;
    z-index: 200;
  }

  @keyframes warn-fade {
    0%   { opacity: 0; transform: translateX(-50%) translateY(-4px); }
    15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
    70%  { opacity: 1; }
    100% { opacity: 0; }
  }

  .mobile-controls {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
    width: 100%;
    justify-content: center;
  }

  .mobile-back-inline {
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

  .hidden-kbd-input {
    position: fixed;
    top: -100px;
    left: 0;
    width: 1px;
    height: 1px;
    opacity: 0;
    pointer-events: none;
    font-size: 16px; /* prevent iOS zoom on focus */
    border: none;
    outline: none;
    background: transparent;
    color: transparent;
  }

  .tap-to-type {
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    letter-spacing: 0.06em;
    color: var(--text);
    border: 1px solid #fbbf2466;
    border-radius: 8px;
    padding: 10px 28px;
    cursor: pointer;
    transition: color 0.15s, border-color 0.15s, background 0.15s, box-shadow 0.15s;
    background: var(--surface);
    user-select: none;
    margin-bottom: 8px;
    box-shadow: 0 0 12px #fbbf2418;
  }

  .tap-to-type.tap-active {
    color: #fbbf24;
    border-color: #fbbf24;
    box-shadow: 0 0 16px #fbbf2430;
  }

  @media (max-width: 640px) {
    .typing-zone {
      padding: 52px 10px 12px;
      gap: 0;
      height: 100dvh;
      justify-content: space-between;
      overflow: hidden;
    }
    .content-group {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .target-key { font-size: 56px; }
    .target-wrap { width: 80px; height: 80px; }
    .target-area { min-height: 100px; gap: 6px; }
    .sequence-preview { max-width: 100%; }
    .keyboard-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
      overflow: hidden;
      height: 225px;
      flex-shrink: 0;
    }
  }
</style>
