<script lang="ts">
  import { onMount } from 'svelte'
  import { ACHIEVEMENT_MAP } from '../achievements/achievements'
  import { sounds } from '../audio/sounds'

  export let ids: string[] = []

  let visible = false
  let currentIdx = 0

  $: current = ACHIEVEMENT_MAP.get(ids[currentIdx])

  function next() {
    if (currentIdx < ids.length - 1) {
      visible = false
      setTimeout(() => { currentIdx++; visible = true }, 300)
    } else {
      visible = false
    }
  }

  onMount(() => {
    if (ids.length === 0) return
    setTimeout(() => { visible = true }, 400)
    sounds.missionComplete()
    // auto-advance after 3s if multiple
    if (ids.length > 1) {
      const t = setInterval(() => {
        if (currentIdx >= ids.length - 1) { clearInterval(t); visible = false }
        else { visible = false; setTimeout(() => { currentIdx++; visible = true }, 300) }
      }, 3000)
    } else {
      setTimeout(() => { visible = false }, 4000)
    }
  })
</script>

{#if visible && current}
  <div class="toast" role="alert">
    <div class="toast-icon">{current.icon}</div>
    <div class="toast-body">
      <div class="toast-label">achievement unlocked</div>
      <div class="toast-name">{current.name}</div>
      <div class="toast-desc">{current.desc}</div>
    </div>
    {#if ids.length > 1}
      <button class="toast-next" on:click={next}>→</button>
    {/if}
  </div>
{/if}

<style>
  .toast {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface);
    border: 1px solid #fbbf2440;
    border-radius: 10px;
    box-shadow: 0 8px 32px #00000080, 0 0 0 1px #fbbf2420;
    z-index: 1000;
    animation: toast-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    max-width: 280px;
  }

  @keyframes toast-in {
    from { opacity: 0; transform: translateY(16px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .toast-icon {
    font-size: 28px;
    flex-shrink: 0;
  }

  .toast-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .toast-label {
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #fbbf24;
    opacity: 0.8;
  }

  .toast-name {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }

  .toast-desc {
    font-size: 11px;
    color: var(--muted);
  }

  .toast-next {
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    flex-shrink: 0;
  }
</style>
