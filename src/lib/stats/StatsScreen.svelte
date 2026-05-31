<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'
  import { loadProgress } from '../lessons/progress'
  import { QWERTY_LAYOUT, FINGER_COLORS } from '../keyboard/layout'
  import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../achievements/achievements'

  const dispatch = createEventDispatcher<{ back: void }>()

  const p = loadProgress()
  let tab: 'heatmap' | 'history' | 'achievements' | 'fingers' = 'heatmap'

  // ── Heatmap data ─────────────────────────────────────────
  function keyHeat(key: string): number {
    const s = p.keyStats[key]
    if (!s || s.presses === 0) return -1  // -1 = no data
    return s.errors / s.presses
  }

  function heatColor(key: string): string {
    const heat = keyHeat(key)
    if (heat < 0) return 'transparent'
    if (heat === 0) return '#34d39920'
    if (heat < 0.05) return '#34d39960'
    if (heat < 0.15) return '#fbbf2460'
    if (heat < 0.30) return '#f9731660'
    return '#f8717170'
  }

  function heatBorder(key: string): string {
    const heat = keyHeat(key)
    if (heat < 0) return 'var(--border)'
    if (heat === 0) return '#34d39966'
    if (heat < 0.05) return '#34d399'
    if (heat < 0.15) return '#fbbf24'
    if (heat < 0.30) return '#f97316'
    return '#f87171'
  }

  function keyAccuracy(key: string): string {
    const s = p.keyStats[key]
    if (!s || s.presses === 0) return 'no data'
    return `${Math.round((1 - s.errors / s.presses) * 100)}%`
  }

  // ── WPM History chart ─────────────────────────────────────
  const sessions = p.sessions.slice(-30)
  const maxWpm   = Math.max(...sessions.map(s => s.wpm), 10)
  const chartW   = 400
  const chartH   = 100

  function chartX(i: number): number {
    return sessions.length < 2
      ? chartW / 2
      : (i / (sessions.length - 1)) * chartW
  }

  function chartY(wpm: number): number {
    return chartH - (wpm / maxWpm) * chartH
  }

  function polyline(): string {
    return sessions.map((s, i) => `${chartX(i)},${chartY(s.wpm)}`).join(' ')
  }

  // ── Finger stats ──────────────────────────────────────────
  const FINGER_ORDER = [
    'left-pinky','left-ring','left-middle','left-index',
    'right-index','right-middle','right-ring','right-pinky',
  ]

  function fingerAccuracy(finger: string): number {
    const f = p.fingers[finger]
    if (!f || f.totalPresses === 0) return -1
    return Math.round((1 - f.errors / f.totalPresses) * 100)
  }

  function fingerGrade(acc: number): string {
    if (acc < 0)  return '—'
    if (acc >= 98) return 'S'
    if (acc >= 94) return 'A'
    if (acc >= 88) return 'B'
    if (acc >= 80) return 'C'
    return 'D'
  }

  function fingerGradeColor(acc: number): string {
    if (acc < 0)   return 'var(--border)'
    if (acc >= 98) return '#e879f9'
    if (acc >= 94) return '#34d399'
    if (acc >= 88) return '#60a5fa'
    if (acc >= 80) return '#fbbf24'
    return '#f87171'
  }

  // ── Achievements ──────────────────────────────────────────
  const unlocked   = ACHIEVEMENTS.filter(a => !!p.achievements[a.id])
  const lockedList = ACHIEVEMENTS.filter(a => !p.achievements[a.id])

  // ── Keyboard nav ──────────────────────────────────────────
  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('back') }
  }

  onMount(() => window.addEventListener('keydown', onKeyDown))
  onDestroy(() => window.removeEventListener('keydown', onKeyDown))

  const ROWS = {
    top:    QWERTY_LAYOUT.filter(k => k.row === 'top'),
    home:   QWERTY_LAYOUT.filter(k => k.row === 'home'),
    bottom: QWERTY_LAYOUT.filter(k => k.row === 'bottom'),
  }
  const OFFSETS: Record<string, number> = { top: 24, home: 36, bottom: 48 }
</script>

<div class="stats-screen">
  <div class="stats-header">
    <button class="back-btn" on:click={() => dispatch('back')}>
      ← <kbd>esc</kbd>
    </button>
    <h2 class="stats-title">stats</h2>
    <div class="summary-pills">
      <span class="pill">{p.totalSessions} rounds</span>
      <span class="pill">{p.daysPlayed.length} days</span>
      <span class="pill">🔥 {p.streak} streak</span>
      <span class="pill">{unlocked.length}/{ACHIEVEMENTS.length} achievements</span>
    </div>
  </div>

  <div class="tabs">
    {#each ['heatmap','history','achievements','fingers'] as t}
      <button class="tab" class:active={tab === t} on:click={() => tab = t}>{t}</button>
    {/each}
  </div>

  <!-- ── HEATMAP ───────────────────────────────────── -->
  {#if tab === 'heatmap'}
    <div class="heatmap-wrap">
      <div class="heatmap-legend">
        <span class="legend-item" style="color:#34d399">● mastered</span>
        <span class="legend-item" style="color:#fbbf24">● needs work</span>
        <span class="legend-item" style="color:#f97316">● struggling</span>
        <span class="legend-item" style="color:#f87171">● weak</span>
        <span class="legend-item" style="color:var(--border)">● no data</span>
      </div>

      <div class="keyboard-heat">
        {#each ['top','home','bottom'] as row}
          <div class="heat-row" style="padding-left:{OFFSETS[row]}px">
            {#each ROWS[row] as key}
              <div
                class="heat-key"
                title="{key.display}: {keyAccuracy(key.key)} accuracy"
                style="background:{heatColor(key.key)}; border-color:{heatBorder(key.key)}"
              >
                <span class="heat-key-label">{key.display}</span>
                {#if p.keyStats[key.key]?.presses > 0}
                  <span class="heat-key-acc">{keyAccuracy(key.key)}</span>
                {/if}
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>

  <!-- ── WPM HISTORY ───────────────────────────────── -->
  {:else if tab === 'history'}
    <div class="history-wrap">
      {#if sessions.length === 0}
        <div class="empty">no sessions yet — complete a round to see history</div>
      {:else}
        <div class="chart-label-top">
          <span>WPM last {sessions.length} sessions</span>
          <span style="color:#fbbf24">peak {maxWpm} WPM</span>
        </div>
        <svg class="wpm-chart" viewBox="0 0 {chartW} {chartH}" preserveAspectRatio="none">
          <!-- grid lines -->
          {#each [0.25, 0.5, 0.75, 1] as frac}
            <line
              x1="0" y1="{chartH * (1 - frac)}"
              x2="{chartW}" y2="{chartH * (1 - frac)}"
              stroke="var(--border)" stroke-width="1"
            />
          {/each}
          <!-- area fill -->
          <polyline
            points="{polyline()} {chartX(sessions.length-1)},{chartH} 0,{chartH}"
            fill="#fbbf2410" stroke="none"
          />
          <!-- line -->
          <polyline
            points={polyline()}
            fill="none"
            stroke="#fbbf24"
            stroke-width="1.5"
            stroke-linejoin="round"
            stroke-linecap="round"
          />
          <!-- dots for each session -->
          {#each sessions as s, i}
            <circle
              cx={chartX(i)} cy={chartY(s.wpm)} r="2.5"
              fill="#fbbf24"
              opacity="0.8"
            >
              <title>{s.wpm} WPM · {s.accuracy}% acc</title>
            </circle>
          {/each}
        </svg>
        <div class="session-list">
          {#each [...sessions].reverse().slice(0, 10) as s}
            <div class="session-row">
              <span class="s-layer">L{s.layerId}</span>
              <span class="s-wpm">{s.wpm} wpm</span>
              <span class="s-acc">{s.accuracy}%</span>
              {#if s.isDaily}<span class="s-badge">daily</span>{/if}
              {#if s.isSpeedBurst}<span class="s-badge">burst</span>{/if}
              {#if s.isBlind}<span class="s-badge">blind</span>{/if}
              <span class="s-date">{new Date(s.ts).toLocaleDateString()}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  <!-- ── ACHIEVEMENTS ──────────────────────────────── -->
  {:else if tab === 'achievements'}
    <div class="achievements-wrap">
      {#if unlocked.length > 0}
        <div class="ach-section-label">unlocked — {unlocked.length}</div>
        <div class="ach-grid">
          {#each unlocked as a}
            <div class="ach-card unlocked">
              <div class="ach-icon">{a.icon}</div>
              <div class="ach-name">{a.name}</div>
              <div class="ach-desc">{a.desc}</div>
            </div>
          {/each}
        </div>
      {/if}
      <div class="ach-section-label" style="margin-top:24px">locked — {lockedList.length}</div>
      <div class="ach-grid">
        {#each lockedList as a}
          <div class="ach-card locked">
            <div class="ach-icon locked-icon">{a.icon}</div>
            <div class="ach-name">{a.name}</div>
            <div class="ach-desc">{a.desc}</div>
          </div>
        {/each}
      </div>
    </div>

  <!-- ── FINGERS ───────────────────────────────────── -->
  {:else if tab === 'fingers'}
    <div class="fingers-wrap">
      <div class="finger-grid">
        {#each FINGER_ORDER as finger}
          {@const acc = fingerAccuracy(finger)}
          {@const grade = fingerGrade(acc)}
          {@const color = fingerGradeColor(acc)}
          {@const stats = p.fingers[finger]}
          <div class="finger-card" style="border-color: {color}22">
            <div class="finger-color-dot" style="background: var(--finger-{finger})"></div>
            <div class="finger-name">{finger.replace('-',' ')}</div>
            <div class="finger-grade" style="color:{color}">{grade}</div>
            {#if acc >= 0}
              <div class="finger-acc">{acc}%</div>
              <div class="finger-presses">{stats?.totalPresses ?? 0} presses</div>
            {:else}
              <div class="finger-acc no-data">no data</div>
            {/if}
          </div>
        {/each}
      </div>
      <div class="grade-legend">
        <span>S ≥98%</span><span>A ≥94%</span><span>B ≥88%</span><span>C ≥80%</span><span>D &lt;80%</span>
      </div>
    </div>
  {/if}
</div>

<style>
  .stats-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 24px 32px;
    gap: 16px;
    overflow: hidden;
  }

  .stats-header {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-shrink: 0;
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

  .back-btn:hover { color: var(--text); border-color: var(--muted); }

  .stats-title {
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .summary-pills {
    display: flex;
    gap: 8px;
    margin-left: auto;
  }

  .pill {
    font-size: 11px;
    color: var(--muted);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 10px;
    background: var(--surface);
  }

  .tabs {
    display: flex;
    gap: 2px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
  }

  .tab {
    padding: 8px 16px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    background: none;
    border: none;
    color: var(--muted);
    cursor: pointer;
    letter-spacing: 0.06em;
    text-transform: lowercase;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab:hover { color: var(--text); }
  .tab.active { color: #fbbf24; border-bottom-color: #fbbf24; }

  /* ── Heatmap ─────────────────────────────────── */
  .heatmap-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    overflow-y: auto;
    flex: 1;
    padding-top: 8px;
  }

  .heatmap-legend {
    display: flex;
    gap: 16px;
    font-size: 11px;
    opacity: 0.8;
  }

  .legend-item { display: flex; align-items: center; gap: 4px; }

  .keyboard-heat {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .heat-row { display: flex; gap: 5px; }

  .heat-key {
    width: 52px;
    height: 52px;
    border-radius: 6px;
    border: 1px solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    transition: all 0.15s;
    cursor: default;
  }

  .heat-key-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
  }

  .heat-key-acc {
    font-size: 9px;
    color: var(--muted);
    letter-spacing: 0.04em;
  }

  /* ── History ─────────────────────────────────── */
  .history-wrap {
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    flex: 1;
    padding-top: 8px;
  }

  .chart-label-top {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--muted);
  }

  .wpm-chart {
    width: 100%;
    height: 100px;
    border: 1px solid var(--border);
    border-radius: 6px;
    background: var(--surface);
  }

  .empty { font-size: 13px; color: var(--border); text-align: center; padding: 40px; }

  .session-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }

  .session-row {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    padding: 6px 10px;
    border-radius: 4px;
    background: var(--surface);
    border: 1px solid var(--border);
  }

  .s-layer { color: var(--muted); width: 24px; flex-shrink: 0; }
  .s-wpm   { color: var(--text); font-weight: 600; width: 60px; }
  .s-acc   { color: var(--muted); width: 40px; }
  .s-badge { font-size: 9px; color: #fbbf24; border: 1px solid #fbbf2440; border-radius: 3px; padding: 1px 5px; }
  .s-date  { color: var(--border); margin-left: auto; font-size: 11px; }

  /* ── Achievements ────────────────────────────── */
  .achievements-wrap {
    overflow-y: auto;
    flex: 1;
    padding-top: 8px;
  }

  .ach-section-label {
    font-size: 10px;
    color: var(--muted);
    letter-spacing: 0.12em;
    text-transform: uppercase;
    margin-bottom: 10px;
  }

  .ach-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 8px;
  }

  .ach-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 12px;
    border-radius: 8px;
    border: 1px solid;
  }

  .ach-card.unlocked {
    border-color: #fbbf2440;
    background: #fbbf2408;
  }

  .ach-card.locked {
    border-color: var(--border);
    background: var(--surface);
    opacity: 0.4;
  }

  .ach-icon { font-size: 20px; }
  .locked-icon { filter: grayscale(1); }
  .ach-name { font-size: 12px; font-weight: 600; color: var(--text); }
  .ach-desc { font-size: 10px; color: var(--muted); }

  /* ── Fingers ─────────────────────────────────── */
  .fingers-wrap {
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow-y: auto;
    flex: 1;
    padding-top: 8px;
    align-items: center;
  }

  .finger-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 600px;
  }

  .finger-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 10px;
    border-radius: 8px;
    border: 1px solid;
    background: var(--surface);
  }

  .finger-color-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .finger-name {
    font-size: 9px;
    color: var(--muted);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-align: center;
  }

  .finger-grade {
    font-size: 28px;
    font-weight: 700;
    line-height: 1;
  }

  .finger-acc {
    font-size: 12px;
    color: var(--muted);
  }

  .finger-acc.no-data { color: var(--border); font-size: 11px; }

  .finger-presses {
    font-size: 9px;
    color: var(--border);
  }

  .grade-legend {
    display: flex;
    gap: 16px;
    font-size: 11px;
    color: var(--muted);
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
