<script lang="ts">
  import { createEventDispatcher } from 'svelte'

  const dispatch = createEventDispatcher<{ tryAnyway: void }>()

  const reasons = [
    { icon: '⌨', text: 'finger-to-key muscle memory — only builds with a physical keyboard' },
    { icon: '♟', text: 'chess rank from Pawn to Grandmaster — tracked per session' },
    { icon: '⚡', text: 'per-finger heatmaps + WPM history across 9 progressive layers' },
    { icon: '👻', text: 'ghost run — race your own personal best on any layer' },
    { icon: '⁘', text: '10 animated fluid backgrounds + full dark / light theme' },
  ]
</script>

<div class="overlay">
  <div class="modal">
    <div class="kbd-row">
      {#each ['A', 'S', 'D', 'F', '·', 'J', 'K', 'L', ';'] as k}
        <span class="key" class:spacer={k === '·'}>{k === '·' ? '' : k}</span>
      {/each}
    </div>

    <div class="modal-header">
      <div class="modal-title"><span class="brand">neuroType</span> needs a keyboard</div>
      <div class="modal-sub">this trainer is built for physical keys — touch screens can't map fingers to keys</div>
    </div>

    <ul class="reason-list">
      {#each reasons as r}
        <li class="reason-item">
          <span class="r-icon">{r.icon}</span>
          <span class="r-text">{r.text}</span>
        </li>
      {/each}
    </ul>

    <div class="cta-block">
      <div class="cta-label">open on a laptop or desktop to start training</div>
      <div class="cta-url">neurotype.app</div>
    </div>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="try-anyway" on:click={() => dispatch('tryAnyway')}>
      try anyway (experience will be limited)
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(0,0,0,0.65);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(8px);
    animation: fade-in 0.25s ease both;
    padding: 16px;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 32px 28px;
    max-width: 400px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.35);
    animation: slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes slide-up {
    from { transform: translateY(24px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .kbd-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }

  .key {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 600;
    color: var(--text);
    background: var(--surface);
    box-shadow: 0 2px 0 var(--border);
    flex-shrink: 0;
  }

  .key.spacer {
    width: 10px;
    border: none;
    background: transparent;
    box-shadow: none;
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .modal-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
    line-height: 1.2;
  }

  .brand {
    font-style: italic;
  }

  .modal-sub {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.02em;
    line-height: 1.5;
  }

  .reason-list {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reason-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .r-icon {
    font-size: 15px;
    width: 20px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .r-text {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.5;
  }

  .cta-block {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 10px;
    background: var(--surface);
  }

  .cta-label {
    font-size: 12px;
    color: var(--muted);
    text-align: center;
    letter-spacing: 0.02em;
  }

  .cta-url {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    font-style: italic;
    letter-spacing: 0.01em;
  }

  .try-anyway {
    text-align: center;
    font-size: 10px;
    color: var(--border);
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: color 0.15s;
  }

  .try-anyway:hover {
    color: var(--muted);
  }
</style>
