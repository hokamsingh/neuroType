<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  const dispatch = createEventDispatcher<{ dismiss: void; daily: void; race: void }>()

  const features = [
    { icon: '⬆', name: '9 progressive layers',  desc: 'home row → free flow — unlock each by hitting the WPM target', cta: null },
    { icon: '♟', name: 'chess rank system',      desc: 'climb from Pawn to Grandmaster based on speed + accuracy',     cta: null },
    { icon: '👻', name: 'ghost run',              desc: 'race your own personal best on any layer',                      cta: null },
    { icon: '⚡', name: 'speed burst',            desc: 'high-intensity timed drills to push your ceiling',              cta: null },
    { icon: '⬇', name: 'race mode',              desc: 'compete against bots with real words at varying speeds',         cta: 'race' },
    { icon: '⁘', name: 'fluid backgrounds',       desc: '10 animated styles — toggle theme + bg in the top-right',      cta: null },
  ]

  function dismiss()    { dispatch('dismiss') }
  function startDaily() { dispatch('daily') }
  function startRace()  { dispatch('race') }

  function onKey(e: KeyboardEvent) {
    if (e.key === ' ' || e.key === 'Escape' || e.key === 'Enter') {
      e.preventDefault()
      dismiss()
    }
  }

  onMount(() => window.addEventListener('keydown', onKey))
  onDestroy(() => window.removeEventListener('keydown', onKey))
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="overlay" on:click={dismiss}>
  <div class="modal" on:click|stopPropagation>
    <div class="modal-header">
      <div class="modal-title">welcome to <span class="brand">neuroType</span></div>
      <div class="modal-sub">map keys to fingers. build muscle memory fast.</div>
    </div>

    <ul class="feature-list">
      {#each features as f}
        <li class="feature-item">
          <span class="f-icon">{f.icon}</span>
          <span class="f-body">
            <span class="f-name">{f.name}</span>
            <span class="f-desc">{f.desc}</span>
          </span>
          {#if f.cta === 'race'}
            <!-- svelte-ignore a11y-click-events-have-key-events -->
            <span class="f-cta" on:click|stopPropagation={startRace}>→ try it</span>
          {/if}
        </li>
      {/each}
    </ul>

    <!-- svelte-ignore a11y-click-events-have-key-events -->
    <!-- svelte-ignore a11y-no-static-element-interactions -->
    <div class="daily-card" on:click|stopPropagation={startDaily}>
      <div class="daily-card-left">
        <span class="daily-card-icon">📅</span>
        <div class="daily-card-text">
          <span class="daily-card-title">today's daily challenge</span>
          <span class="daily-card-sub">one layer, every day — build your streak</span>
        </div>
      </div>
      <button class="daily-card-btn" on:click|stopPropagation={startDaily}>
        → start
      </button>
    </div>

    <button class="start-btn" on:click={dismiss}>
      press <kbd>space</kbd> to start
    </button>

    <div class="signature">
      built for those who type with intent &mdash; <a href="https://github.com/hokamsingh" target="_blank" rel="noopener">hokamsingh</a>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: rgba(0,0,0,0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(6px);
    animation: fade-in 0.25s ease both;
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  .modal {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 36px 40px;
    max-width: 520px;
    width: 90%;
    display: flex;
    flex-direction: column;
    gap: 28px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.25);
    animation: slide-up 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
  }

  @keyframes slide-up {
    from { transform: translateY(20px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }

  .modal-header {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .modal-title {
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: -0.01em;
  }

  .brand {
    color: var(--text);
    font-style: italic;
  }

  .modal-sub {
    font-size: 12px;
    color: var(--muted);
    letter-spacing: 0.05em;
  }

  .feature-list {
    list-style: none;
    padding: 0; margin: 0;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .feature-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .f-icon {
    font-size: 16px;
    width: 22px;
    flex-shrink: 0;
    color: var(--text);
    margin-top: 1px;
  }

  .f-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .f-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .f-desc {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.5;
  }

  .f-cta {
    flex-shrink: 0;
    align-self: center;
    font-size: 10px;
    font-weight: 600;
    color: #f97316;
    border: 1px solid #f9731640;
    border-radius: 4px;
    padding: 2px 8px;
    cursor: pointer;
    letter-spacing: 0.04em;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .f-cta:hover {
    background: #f9731618;
    border-color: #f97316;
  }

  /* Daily challenge card */
  .daily-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #fbbf2440;
    border-radius: 10px;
    background: #fbbf2408;
    cursor: pointer;
    transition: background 0.15s, border-color 0.15s;
  }

  .daily-card:hover {
    background: #fbbf2412;
    border-color: #fbbf2466;
  }

  .daily-card-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .daily-card-icon {
    font-size: 20px;
    flex-shrink: 0;
  }

  .daily-card-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .daily-card-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .daily-card-sub {
    font-size: 11px;
    color: var(--muted);
    line-height: 1.4;
  }

  .daily-card-btn {
    flex-shrink: 0;
    background: #fbbf24;
    color: #000;
    border: none;
    border-radius: 6px;
    padding: 7px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .daily-card-btn:hover {
    opacity: 0.85;
  }

  .start-btn {
    align-self: center;
    background: var(--text);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    padding: 10px 28px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.06em;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: opacity 0.15s;
  }

  .start-btn:hover { opacity: 0.75; }

  kbd {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    border: 1px solid var(--bg);
    border-radius: 3px;
    padding: 1px 5px;
    opacity: 0.6;
    background: transparent;
  }

  .signature {
    text-align: right;
    font-size: 11px;
    font-style: italic;
    color: var(--border);
    letter-spacing: 0.04em;
  }

  .signature a {
    color: var(--muted);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.15s;
  }

  .signature a:hover { color: var(--text); }
</style>
