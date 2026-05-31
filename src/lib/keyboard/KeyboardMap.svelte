<script lang="ts">
  import { KEYBOARD_ROWS, FINGER_COLORS, type Finger, type KeyDef } from './layout'

  export let activeKey: string | null = null
  export let flashKey: string | null = null
  export let flashCorrect: boolean = true
  export let highlightFinger: Finger | null = null
  /** Keys that should be physically held down — shown as dim anchor glow */
  export let anchorKeys: string[] = []
  /** Set of home-row keys the user has actually lifted (detected via keyup) */
  export let liftedKeys: Set<string> = new Set()

  const ROW_OFFSETS: Record<string, number> = {
    top: 24,
    home: 36,
    bottom: 48,
  }

  function keyStyle(key: KeyDef): string {
    const color  = FINGER_COLORS[key.finger]
    const isActive    = activeKey === key.key
    const isHighlight = highlightFinger === key.finger && !isActive
    const isAnchor    = anchorKeys.includes(key.key)
    const isLifted    = liftedKeys.has(key.key)

    if (isActive || isHighlight) {
      return `border-color: ${color}; background-color: ${color}; color: #000;`
    }
    if (isLifted && isAnchor) {
      return `border-color: #f8717188; color: #f87171; background: #f8717110;`
    }
    if (isAnchor) {
      return `border-color: ${color}55; color: ${color}66; background: ${color}0a;`
    }
    return `border-color: ${color}1a; color: ${color}44;`
  }

  function extraClass(key: KeyDef): string {
    const classes: string[] = []
    if (flashKey === key.key) classes.push(flashCorrect ? 'flash-correct' : 'flash-wrong')
    if (anchorKeys.includes(key.key) && !liftedKeys.has(key.key)) classes.push('anchor-pulse')
    if (liftedKeys.has(key.key) && anchorKeys.includes(key.key)) classes.push('lifted-warn')
    return classes.join(' ')
  }
</script>

<div class="kbd-outer">
<div class="keyboard-wrap select-none" aria-hidden="true">
  {#each ['top','home','bottom'] as rowName}
    <div class="key-row" style="padding-left: {ROW_OFFSETS[rowName]}px">
      {#each KEYBOARD_ROWS[rowName] as key}
        <div class="key {extraClass(key)}" style={keyStyle(key)}>
          {key.display}
        </div>
      {/each}
    </div>
  {/each}

  <!-- Space bar -->
  <div class="key-row justify-center mt-1">
    <div
      class="key space-key {flashKey === ' ' ? (flashCorrect ? 'flash-correct' : 'flash-wrong') : ''}"
      style="border-color: var(--finger-thumb)1a; color: var(--finger-thumb)44; width: 240px;"
    >
      SPACE
    </div>
  </div>
</div>
</div>

<style>
  .kbd-outer {
    display: flex;
    justify-content: center;
  }

  .keyboard-wrap {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: var(--bg);
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .key-row {
    display: flex;
    gap: 4px;
  }

  .key {
    width: 42px;
    height: 42px;
    border-radius: 6px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 500;
    font-family: 'JetBrains Mono', monospace;
    transition: background-color 0.1s, color 0.1s, border-color 0.1s;
    user-select: none;
  }

  .space-key {
    width: 240px;
    height: 36px;
    font-size: 10px;
  }

  /* Anchor keys breathe subtly */
  .anchor-pulse {
    animation: anchor-breathe 2s ease-in-out infinite;
  }

  @keyframes anchor-breathe {
    0%, 100% { opacity: 0.7; }
    50%       { opacity: 1; }
  }

  /* Lifted when shouldn't be */
  .lifted-warn {
    animation: lift-shake 0.25s ease-in-out;
  }

  @keyframes lift-shake {
    0%, 100% { transform: translateX(0); }
    33%       { transform: translateX(-2px); }
    66%       { transform: translateX(2px); }
  }

  @media (max-width: 640px) {
    .keyboard-wrap {
      transform: scale(0.72);
      transform-origin: top center;
    }
  }
</style>
