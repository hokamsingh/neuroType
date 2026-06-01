<script lang="ts">
  import { createEventDispatcher, onMount, onDestroy } from 'svelte'

  const dispatch = createEventDispatcher<{ back: void }>()

  const SECTIONS = [
    {
      id: 'posture',
      label: 'posture & setup',
      icon: '◎',
      tips: [
        {
          title: 'float your wrists',
          body: 'wrists should hover above the desk — never rest on the surface while typing. contact kills wrist mobility and causes strain over time.',
        },
        {
          title: 'curve your fingers',
          body: 'rest on the finger pads, not the tips. think of cupping a tennis ball. flat fingers lose leverage on fast reaches.',
        },
        {
          title: 'elbows at 90°',
          body: 'forearms parallel to the floor. if your shoulders are raised, the keyboard is too high. proper height eliminates most tension.',
        },
        {
          title: 'screen at eye level',
          body: 'looking down causes neck fatigue that creeps into shoulder tension, which slows fingers. elevate the monitor if needed.',
        },
      ],
    },
    {
      id: 'technique',
      label: 'home row technique',
      icon: '⌨',
      tips: [
        {
          title: 'home row is home base',
          body: 'every finger has a resting key: A S D F · J K L ; — return to these after every single press. this is the entire game.',
        },
        {
          title: 'one finger reaches, others anchor',
          body: 'when one finger moves, all others stay planted. a hand that drifts causes every subsequent keystroke to mis-aim.',
        },
        {
          title: 'snap back immediately',
          body: 'after pressing a key, return the finger before the next keystroke — not after. the snap-back is part of the motion, not a separate step.',
        },
        {
          title: 'each key belongs to exactly one finger',
          body: 'left index owns F G. right index owns J H. never cheat with the wrong finger — you are training a reflex, not solving a puzzle.',
        },
        {
          title: 'thumbs on space, always',
          body: 'either thumb can hit space. the dominant thumb is fine. what matters is that thumbs never drift to other keys.',
        },
      ],
    },
    {
      id: 'strategy',
      label: 'practice strategy',
      icon: '◈',
      tips: [
        {
          title: 'accuracy first, always',
          body: 'one wrong key costs more total time than typing slowly. a 98% accurate typist at 40 WPM reaches 60 WPM faster than a 90% accurate typist at 60 WPM.',
        },
        {
          title: 'slow is smooth, smooth is fast',
          body: 'deliberate slow practice burns the correct motion into muscle memory. speed is a byproduct of clean mechanics, not of rushing.',
        },
        {
          title: 'short sessions beat long marathons',
          body: 'motor learning consolidates during rest. 15 minutes daily beats 2 hours once a week. use the daily challenge to enforce this.',
        },
        {
          title: 'drill your weak key',
          body: 'the weak key shown on home is statistically your worst performer. start each session with 30 seconds of deliberate presses on it.',
        },
        {
          title: 'do not look at your hands',
          body: 'glancing breaks the feedback loop between ear/eye → brain → finger. if you must look, the reflex has not formed yet — slow down instead.',
        },
        {
          title: 'blind mode + word announce',
          body: 'pair blind mode (no keyboard map) with word announce (TTS reads each key) and close your eyes. pure auditory → motor training. hardest mode, fastest transfer.',
        },
      ],
    },
    {
      id: 'mental',
      label: 'mental model',
      icon: '⬡',
      tips: [
        {
          title: 'think in fingers, not hands',
          body: '"reach with left-middle" is faster than "reach left". the more specific your mental target, the more precise the motor output.',
        },
        {
          title: 'feel the reach zones',
          body: 'before a session, rest hands on ASDF·JKL; and close your eyes. feel the reach to Q, reach to R, reach to B. mental map first.',
        },
        {
          title: 'errors are data, not failure',
          body: 'every wrong press tells you which motor reflex is missing. treat errors as calibration signals — they are doing the work.',
        },
        {
          title: 'rhythm matters more than bursts',
          body: 'a steady 50 WPM with no hesitation beats 80 WPM with pauses. the metronome setting trains consistent timing — use it.',
        },
      ],
    },
    {
      id: 'progress',
      label: 'progression',
      icon: '◆',
      tips: [
        {
          title: 'unlock layers in order',
          body: 'each layer introduces new reach zones. skipping layers means drilling the new key without the anchoring reflex that should already be automatic.',
        },
        {
          title: 'target WPM before advancing',
          body: 'the WPM gate per layer is calibrated so the prior keys are reflex, not thought. meeting it means your hands are ready, not just your brain.',
        },
        {
          title: 'revisit completed layers',
          body: 'once all layers are unlocked, go back to L0 and sprint. the goal is pushing your ceiling on keys you mastered, not just surviving new ones.',
        },
        {
          title: 'use race mode for sustained speed',
          body: 'lesson mode drills individual keys. race mode drills common English words — the actual context speed lives in. do both.',
        },
      ],
    },
  ]

  let activeSection = SECTIONS[0].id

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { e.preventDefault(); dispatch('back') }
  }

  onMount(() => window.addEventListener('keydown', onKeyDown))
  onDestroy(() => window.removeEventListener('keydown', onKeyDown))
</script>

<div class="tips-screen">
  <div class="tips-header">
    <button class="back-btn" on:click={() => dispatch('back')}>← <kbd>esc</kbd></button>
    <h2 class="tips-title">tips &amp; tricks</h2>
  </div>

  <div class="tips-body">
    <nav class="tips-nav">
      {#each SECTIONS as sec}
        <button
          class="nav-item"
          class:active={activeSection === sec.id}
          on:click={() => activeSection = sec.id}
        >
          <span class="nav-icon">{sec.icon}</span>
          {sec.label}
        </button>
      {/each}
    </nav>

    <div class="tips-content">
      {#each SECTIONS as sec}
        {#if activeSection === sec.id}
          <div class="section-body">
            {#each sec.tips as tip, i}
              <div class="tip-card" style="animation-delay: {i * 0.04}s">
                <div class="tip-title">{tip.title}</div>
                <div class="tip-body">{tip.body}</div>
              </div>
            {/each}
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>

<style>
  .tips-screen {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: 32px;
    gap: 24px;
    max-width: 720px;
    margin: 0 auto;
  }

  .tips-header {
    display: flex;
    align-items: center;
    gap: 16px;
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
    transition: color 0.15s, border-color 0.15s;
  }

  .back-btn:hover {
    color: var(--text);
    border-color: var(--muted);
  }

  .tips-title {
    font-size: 20px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text);
  }

  .tips-body {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 20px;
    flex: 1;
    min-height: 0;
  }

  .tips-nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    align-self: start;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    border: 1px solid transparent;
    background: transparent;
    color: var(--muted);
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.04em;
    cursor: pointer;
    text-align: left;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
    white-space: nowrap;
  }

  .nav-item:hover {
    color: var(--text);
    background: var(--surface);
    border-color: var(--border);
  }

  .nav-item.active {
    color: var(--text);
    background: var(--surface);
    border-color: var(--border);
  }

  .nav-icon {
    font-size: 13px;
    opacity: 0.6;
    flex-shrink: 0;
  }

  .tips-content {
    overflow-y: auto;
    padding-right: 4px;
  }

  .section-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tip-card {
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    display: flex;
    flex-direction: column;
    gap: 6px;
    animation: tip-in 0.2s ease both;
  }

  @keyframes tip-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .tip-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    letter-spacing: 0.02em;
  }

  .tip-body {
    font-size: 12px;
    color: var(--muted);
    line-height: 1.65;
    letter-spacing: 0.01em;
  }

  kbd {
    font-size: 9px;
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 1px 4px;
    color: var(--muted);
    background: var(--bg);
  }

  @media (max-width: 640px) {
    .tips-screen {
      padding: 52px 16px 24px;
      gap: 16px;
    }

    .tips-body {
      grid-template-columns: 1fr;
      gap: 12px;
    }

    .tips-nav {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 4px;
    }

    .nav-item {
      font-size: 10px;
      padding: 7px 10px;
    }
  }
</style>
