<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { loadProgress, saveSettings } from '../lessons/progress'
  import type { Settings, FluidBg } from '../lessons/progress'

  const dispatch = createEventDispatcher<{ back: void; fluidChange: FluidBg }>()

  const p = loadProgress()
  let settings: Settings = { ...p.settings }

  function applyTheme(theme: 'dark' | 'light') {
    document.documentElement.setAttribute('data-theme', theme)
  }

  function toggle(key: keyof Settings) {
    settings = { ...settings, [key]: !settings[key] }
    saveSettings(settings)
  }

  function toggleTheme() {
    const next = settings.theme === 'dark' ? 'light' : 'dark'
    settings = { ...settings, theme: next }
    saveSettings(settings)
    applyTheme(next)
  }

  const FLUID_OPTIONS: FluidBg[] = ['aurora','metal','topo','silk','blobs','wireframe','smoke','grain','particles','fog','off']
  const FLUID_LABELS: Record<FluidBg, string> = {
    aurora:    '✦ aurora',
    metal:     '⬡ metal',
    topo:      '⌇ topo',
    silk:      '≋ silk',
    blobs:     '◉ blobs',
    wireframe: '⊞ wireframe',
    smoke:     '≈ smoke',
    grain:     '⁘ grain',
    particles: '⁺ particles',
    fog:       '░ fog',
    off:       '○ off',
  }

  function cycleFluid() {
    const cur  = settings.fluidBg ?? 'orbs'
    const idx  = FLUID_OPTIONS.indexOf(cur)
    const next = FLUID_OPTIONS[(idx + 1) % FLUID_OPTIONS.length]
    settings = { ...settings, fluidBg: next }
    saveSettings(settings)
    dispatch('fluidChange', next)
  }

  onMount(() => {
    applyTheme(settings.theme ?? 'dark')
    window.addEventListener('keydown', onKeyDown)
  })

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('back') }
  }

  onDestroy(() => window.removeEventListener('keydown', onKeyDown))
</script>

<div class="settings-screen">
  <div class="settings-header">
    <button class="back-btn" on:click={() => dispatch('back')}>← <kbd>esc</kbd></button>
    <h2 class="settings-title">settings</h2>
  </div>

  <div class="settings-list">
    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">sound effects</div>
        <div class="setting-desc">key clicks, streak sounds, rank-up ceremony</div>
      </div>
      <button
        class="toggle" class:on={settings.soundEnabled}
        on:click={() => toggle('soundEnabled')}
      >{settings.soundEnabled ? 'on' : 'off'}</button>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">metronome</div>
        <div class="setting-desc">audible beat to keep rhythm steady</div>
      </div>
      <button
        class="toggle" class:on={settings.metronomeEnabled}
        on:click={() => toggle('metronomeEnabled')}
      >{settings.metronomeEnabled ? 'on' : 'off'}</button>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">anchor hints</div>
        <div class="setting-desc">show which fingers should stay on home row</div>
      </div>
      <button
        class="toggle" class:on={settings.anchorHintsEnabled}
        on:click={() => toggle('anchorHintsEnabled')}
      >{settings.anchorHintsEnabled ? 'on' : 'off'}</button>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">blind mode</div>
        <div class="setting-desc">hide keyboard map — forces pure neural recall</div>
      </div>
      <button
        class="toggle" class:on={settings.blindMode}
        on:click={() => toggle('blindMode')}
      >{settings.blindMode ? 'on' : 'off'}</button>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">theme</div>
        <div class="setting-desc">switch between dark and light appearance</div>
      </div>
      <button class="toggle on" on:click={toggleTheme}>
        {settings.theme === 'light' ? '☀ light' : '☾ dark'}
      </button>
    </div>

    <div class="setting-row">
      <div class="setting-info">
        <div class="setting-name">background</div>
        <div class="setting-desc">animated background — works in any theme</div>
      </div>
      <button class="toggle on fluid-cycle" on:click={cycleFluid}>
        {FLUID_LABELS[settings.fluidBg ?? 'orbs']}
      </button>
    </div>
  </div>

  <div class="kb-section">
    <div class="kb-title">keyboard shortcuts</div>
    <div class="kb-grid">
      <div class="kb-group">
        <div class="kb-group-label">home</div>
        <div class="kb-row"><kbd>Tab</kbd> <span>cycle lessons</span></div>
        <div class="kb-row"><kbd>← ↑</kbd> <span>previous lesson</span></div>
        <div class="kb-row"><kbd>→ ↓</kbd> <span>next lesson</span></div>
        <div class="kb-row"><kbd>Space</kbd> <span>start lesson</span></div>
      </div>
      <div class="kb-group">
        <div class="kb-group-label">lesson</div>
        <div class="kb-row"><kbd>Esc</kbd> <span>back to home</span></div>
        <div class="kb-row"><kbd>Space</kbd> <span>retry (after done)</span></div>
        <div class="kb-row"><kbd>Enter</kbd> <span>view results</span></div>
      </div>
      <div class="kb-group">
        <div class="kb-group-label">race</div>
        <div class="kb-row"><kbd>F9</kbd> <span>pause / resume</span></div>
        <div class="kb-row"><kbd>Esc</kbd> <span>quit modal + summary</span></div>
      </div>
      <div class="kb-group">
        <div class="kb-group-label">everywhere</div>
        <div class="kb-row"><kbd>Esc</kbd> <span>back / close</span></div>
      </div>
    </div>
  </div>

  <div class="settings-footer">
    settings auto-save
  </div>
</div>

<style>
  .settings-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 32px;
    gap: 24px;
    max-width: 560px;
    margin: 0 auto;
  }

  .settings-header {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: 1px solid var(--border);
    color: var(--muted);
    padding: 4px 10px;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
  }

  .settings-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
  }

  .settings-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    gap: 16px;
  }

  .setting-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .setting-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--text);
  }

  .setting-desc {
    font-size: 11px;
    color: var(--muted);
  }

  .toggle {
    flex-shrink: 0;
    padding: 6px 16px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
    min-width: 48px;
    text-align: center;
  }

  .toggle.on {
    border-color: #34d39966;
    color: #34d399;
    background: #34d39910;
  }

  .fluid-cycle {
    min-width: 100px;
    letter-spacing: 0.04em;
  }

  .settings-footer {
    font-size: 11px;
    color: var(--border);
    letter-spacing: 0.06em;
    margin-top: auto;
  }

  kbd {
    font-size: 9px;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 4px;
    color: var(--muted);
    background: var(--bg);
  }

  /* Keyboard legend */
  .kb-section {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .kb-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .kb-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  .kb-group {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    flex-direction: column;
    gap: 7px;
  }

  .kb-group-label {
    font-size: 9px;
    font-weight: 700;
    color: var(--muted);
    letter-spacing: 0.1em;
    text-transform: uppercase;
    margin-bottom: 2px;
  }

  .kb-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--muted);
  }

  .kb-row kbd {
    font-size: 9px;
    flex-shrink: 0;
    white-space: nowrap;
  }

  .kb-row span {
    color: var(--text);
    font-size: 11px;
  }

  @media (max-width: 640px) {
    .settings-screen { padding-top: 52px; overflow-y: auto; }
  }
</style>
