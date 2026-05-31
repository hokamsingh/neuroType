<script lang="ts">
  import type { FluidBg } from '../lessons/progress'
  export let variant: FluidBg = 'aurora'

  function particleField(node: HTMLCanvasElement) {
    const W = window.innerWidth
    const H = window.innerHeight
    node.width  = W
    node.height = H
    const ctx = node.getContext('2d')!

    interface P { x: number; y: number; px: number; py: number; speed: number }
    const pts: P[] = Array.from({ length: 700 }, () => {
      const x = Math.random() * W
      const y = Math.random() * H
      return { x, y, px: x, py: y, speed: 0.5 + Math.random() * 0.7 }
    })

    let t = 0
    let raf = 0

    function angle(x: number, y: number) {
      return Math.sin(x * 0.004 + t * 0.4) * Math.PI
           + Math.cos(y * 0.003 + t * 0.25) * Math.PI * 0.5
    }

    function loop() {
      raf = requestAnimationFrame(loop)
      t += 0.004
      const dark = document.documentElement.getAttribute('data-theme') !== 'light'
      ctx.fillStyle = dark ? 'rgba(4,4,6,0.15)' : 'rgba(255,255,255,0.15)'
      ctx.fillRect(0, 0, W, H)
      ctx.lineWidth = 1
      for (const p of pts) {
        const a = angle(p.x, p.y)
        p.px = p.x; p.py = p.y
        p.x += Math.cos(a) * p.speed
        p.y += Math.sin(a) * p.speed
        if (p.x < -2 || p.x > W + 2 || p.y < -2 || p.y > H + 2) {
          p.x = Math.random() * W; p.y = Math.random() * H
          p.px = p.x; p.py = p.y; continue
        }
        const alpha = Math.min(p.speed / 1.2, 1)
        ctx.strokeStyle = dark ? `rgba(180,180,180,${alpha * 0.22})` : `rgba(30,30,30,${alpha * 0.14})`
        ctx.beginPath(); ctx.moveTo(p.px, p.py); ctx.lineTo(p.x, p.y); ctx.stroke()
      }
    }

    loop()
    return { destroy() { cancelAnimationFrame(raf) } }
  }
</script>

{#if variant !== 'off'}
<div class="fluid-root">

  <!-- ── 1. AURORA ─────────────────────────────────────── -->
  {#if variant === 'aurora'}
    <div class="au-bg">
      <div class="au-g au-g1"></div>
      <div class="au-g au-g2"></div>
      <div class="au-g au-g3"></div>
      <div class="au-g au-g4"></div>
      <div class="au-g au-g5"></div>
    </div>

  <!-- ── 2. METAL ──────────────────────────────────────── -->
  {:else if variant === 'metal'}
    <div class="mt-bg">
      <div class="mt-band mt-b1"></div>
      <div class="mt-band mt-b2"></div>
      <div class="mt-band mt-b3"></div>
      <div class="mt-shine"></div>
    </div>

  <!-- ── 3. TOPO ───────────────────────────────────────── -->
  {:else if variant === 'topo'}
    <svg class="topo-svg" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="tp1" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.004" numOctaves="4" seed="11">
            <animate attributeName="seed" values="11;90;11" dur="45s" repeatCount="indefinite"/>
          </feTurbulence>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 20 -8"/>
        </filter>
        <filter id="tp2" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.004" numOctaves="4" seed="11">
            <animate attributeName="seed" values="11;90;11" dur="45s" repeatCount="indefinite"/>
          </feTurbulence>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 20 -11"/>
        </filter>
        <filter id="tp3" x="0%" y="0%" width="100%" height="100%" color-interpolation-filters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.006 0.004" numOctaves="4" seed="11">
            <animate attributeName="seed" values="11;90;11" dur="45s" repeatCount="indefinite"/>
          </feTurbulence>
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 20 -14"/>
        </filter>
      </defs>
      <rect width="100%" height="100%" filter="url(#tp1)" opacity="0.055"/>
      <rect width="100%" height="100%" filter="url(#tp2)" opacity="0.038"/>
      <rect width="100%" height="100%" filter="url(#tp3)" opacity="0.025"/>
    </svg>

  <!-- ── 4. SILK ───────────────────────────────────────── -->
  {:else if variant === 'silk'}
    <div class="sk-bg">
      <div class="sk-fold sk-f1"></div>
      <div class="sk-fold sk-f2"></div>
      <div class="sk-fold sk-f3"></div>
      <div class="sk-fold sk-f4"></div>
      <div class="sk-fold sk-f5"></div>
    </div>

  <!-- ── 5. BLOBS ──────────────────────────────────────── -->
  {:else if variant === 'blobs'}
    <div class="bl-wrap">
      <div class="bl bl-1"></div>
      <div class="bl bl-2"></div>
      <div class="bl bl-3"></div>
      <div class="bl bl-4"></div>
      <div class="bl bl-5"></div>
    </div>

  <!-- ── 6. WIREFRAME ──────────────────────────────────── -->
  {:else if variant === 'wireframe'}
    <div class="wf-scene">
      <div class="wf-grid"></div>
      <div class="wf-ft"></div>
      <div class="wf-fb"></div>
    </div>

  <!-- ── 7. SMOKE ──────────────────────────────────────── -->
  {:else if variant === 'smoke'}
    <div class="sm-bg">
      <div class="sm-p sm-p1"></div>
      <div class="sm-p sm-p2"></div>
      <div class="sm-p sm-p3"></div>
      <div class="sm-p sm-p4"></div>
      <div class="sm-p sm-p5"></div>
      <div class="sm-p sm-p6"></div>
    </div>

  <!-- ── 8. GRAIN ──────────────────────────────────────── -->
  {:else if variant === 'grain'}
    <div class="gr-bg">
      <div class="gr-blob gr-b1"></div>
      <div class="gr-blob gr-b2"></div>
      <div class="gr-blob gr-b3"></div>
    </div>
    <svg class="gr-noise" xmlns="http://www.w3.org/2000/svg">
      <filter id="grf">
        <feTurbulence type="fractalNoise" baseFrequency="0.68" numOctaves="3" stitchTiles="stitch">
          <animate attributeName="seed" values="0;200;0" dur="10s" repeatCount="indefinite"/>
        </feTurbulence>
        <feColorMatrix type="saturate" values="0"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grf)" opacity="0.045"/>
    </svg>

  <!-- ── 9. PARTICLES ──────────────────────────────────── -->
  {:else if variant === 'particles'}
    <canvas class="pt-canvas" use:particleField></canvas>

  <!-- ── 10. FOG ───────────────────────────────────────── -->
  {:else if variant === 'fog'}
    <div class="fg-bg">
      <div class="fg-c fg-c1"></div>
      <div class="fg-c fg-c2"></div>
      <div class="fg-c fg-c3"></div>
      <div class="fg-bm fg-bm1"></div>
      <div class="fg-bm fg-bm2"></div>
      <div class="fg-bm fg-bm3"></div>
    </div>
  {/if}

</div>
{/if}

<style>
  .fluid-root {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    overflow: hidden;
  }

  /* ══════════════════════════════════════════════════════
     1. AURORA — black bg, white light flows
  ══════════════════════════════════════════════════════ */
  .au-bg {
    position: absolute; inset: 0;
    background: #040608;
  }
  :global([data-theme="light"]) .au-bg { background: transparent; }
  .au-g {
    position: absolute; border-radius: 50%;
    will-change: transform;
  }
  .au-g1 {
    width: 1200px; height: 800px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.048) 0%, transparent 65%);
    top: -300px; left: -200px;
    filter: blur(70px);
    animation: au1 44s ease-in-out infinite;
  }
  .au-g2 {
    width: 900px; height: 650px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.038) 0%, transparent 65%);
    bottom: -200px; right: -100px;
    filter: blur(80px);
    animation: au2 52s ease-in-out infinite;
  }
  .au-g3 {
    width: 600px; height: 420px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.058) 0%, transparent 65%);
    top: 22%; left: 38%;
    filter: blur(55px);
    animation: au3 34s ease-in-out infinite;
  }
  .au-g4 {
    width: 420px; height: 300px;
    background: radial-gradient(ellipse, rgba(200,215,255,0.042) 0%, transparent 65%);
    top: 58%; left: 8%;
    filter: blur(45px);
    animation: au4 26s ease-in-out infinite;
  }
  .au-g5 {
    width: 360px; height: 260px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.032) 0%, transparent 65%);
    top: 8%; right: 12%;
    filter: blur(40px);
    animation: au5 20s ease-in-out infinite;
  }
  /* light-mode aurora: dark wisps on white */
  :global([data-theme="light"]) .au-g1 { background: radial-gradient(ellipse, rgba(0,0,0,0.055) 0%, transparent 65%); }
  :global([data-theme="light"]) .au-g2 { background: radial-gradient(ellipse, rgba(0,0,0,0.042) 0%, transparent 65%); }
  :global([data-theme="light"]) .au-g3 { background: radial-gradient(ellipse, rgba(0,0,0,0.065) 0%, transparent 65%); }
  :global([data-theme="light"]) .au-g4 { background: radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 65%); }
  :global([data-theme="light"]) .au-g5 { background: radial-gradient(ellipse, rgba(0,0,0,0.035) 0%, transparent 65%); }
  @keyframes au1 {
    0%,100% { transform: translate(0,0) scale(1); }
    25%  { transform: translate(200px, 90px) scale(1.1); }
    50%  { transform: translate(360px,240px) scale(1.2); }
    75%  { transform: translate(140px,330px) scale(1.06); }
  }
  @keyframes au2 {
    0%,100% { transform: translate(0,0) scale(1); }
    35%  { transform: translate(-170px,-110px) scale(1.12); }
    65%  { transform: translate(-290px,-240px) scale(1.18); }
    80%  { transform: translate(-110px,-310px) scale(1.08); }
  }
  @keyframes au3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(-140px,110px) scale(0.88); }
  }
  @keyframes au4 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(110px,-75px) scale(1.16); }
  }
  @keyframes au5 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(-75px,55px) scale(1.22); }
  }

  /* ══════════════════════════════════════════════════════
     2. METAL — chrome bands, Apple-inspired
  ══════════════════════════════════════════════════════ */
  .mt-bg {
    position: absolute; inset: 0;
    background: linear-gradient(160deg, #0c0c0c 0%, #080808 50%, #0a0a0a 100%);
    overflow: hidden;
  }
  :global([data-theme="light"]) .mt-bg { background: transparent; }
  .mt-band {
    position: absolute; will-change: transform, opacity;
  }
  .mt-b1 {
    width: 220%; height: 280px;
    background: linear-gradient(90deg,
      transparent 0%, rgba(160,160,160,0.055) 25%,
      rgba(220,220,220,0.11) 50%,
      rgba(160,160,160,0.055) 75%, transparent 100%);
    top: 12%; left: -60%;
    transform: rotate(-7deg);
    filter: blur(10px);
    animation: mb1 22s ease-in-out infinite;
  }
  .mt-b2 {
    width: 220%; height: 200px;
    background: linear-gradient(90deg,
      transparent 0%, rgba(120,120,120,0.04) 30%,
      rgba(190,190,190,0.08) 50%,
      rgba(120,120,120,0.04) 70%, transparent 100%);
    top: 46%; left: -60%;
    transform: rotate(-7deg);
    filter: blur(14px);
    animation: mb2 30s ease-in-out infinite;
  }
  .mt-b3 {
    width: 220%; height: 160px;
    background: linear-gradient(90deg,
      transparent 0%, rgba(100,100,100,0.035) 30%,
      rgba(160,160,160,0.065) 50%,
      rgba(100,100,100,0.035) 70%, transparent 100%);
    top: 73%; left: -60%;
    transform: rotate(-7deg);
    filter: blur(18px);
    animation: mb3 38s ease-in-out infinite;
  }
  .mt-shine {
    position: absolute;
    width: 55%; height: 70%;
    top: 15%; left: 22%;
    background: radial-gradient(ellipse at 45% 35%, rgba(255,255,255,0.035) 0%, transparent 60%);
    filter: blur(45px);
    animation: msh 18s ease-in-out infinite;
  }
  /* light-mode metal: dark bands on white */
  :global([data-theme="light"]) .mt-b1 { background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%, transparent 100%); }
  :global([data-theme="light"]) .mt-b2 { background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.028) 30%, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.028) 70%, transparent 100%); }
  :global([data-theme="light"]) .mt-b3 { background: linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.022) 30%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.022) 70%, transparent 100%); }
  :global([data-theme="light"]) .mt-shine { background: radial-gradient(ellipse at 45% 35%, rgba(0,0,0,0.03) 0%, transparent 60%); }
  @keyframes mb1 {
    0%,100% { transform: rotate(-7deg) translateY(0px); opacity: 1; }
    50%  { transform: rotate(-7deg) translateY(35px); opacity: 0.55; }
  }
  @keyframes mb2 {
    0%,100% { transform: rotate(-7deg) translateY(0px); opacity: 0.75; }
    50%  { transform: rotate(-7deg) translateY(-28px); opacity: 1; }
  }
  @keyframes mb3 {
    0%,100% { transform: rotate(-7deg) translateY(0px); opacity: 0.6; }
    50%  { transform: rotate(-7deg) translateY(18px); opacity: 0.9; }
  }
  @keyframes msh {
    0%,100% { transform: scale(1); opacity: 1; }
    50%  { transform: scale(1.35) translate(45px,-28px); opacity: 0.45; }
  }

  /* ══════════════════════════════════════════════════════
     3. TOPO — topographic contour lines
  ══════════════════════════════════════════════════════ */
  .topo-svg {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
  }

  /* ══════════════════════════════════════════════════════
     4. SILK — dark fabric folds
  ══════════════════════════════════════════════════════ */
  .sk-bg {
    position: absolute; inset: 0;
    background: #030303;
    overflow: hidden;
  }
  :global([data-theme="light"]) .sk-bg { background: transparent; }
  .sk-fold {
    position: absolute; will-change: transform, opacity;
  }
  .sk-f1 {
    width: 220%; height: 240px;
    background: linear-gradient(0deg, transparent, rgba(255,255,255,0.028), transparent);
    top: 7%; left: -60%;
    transform: rotate(-4deg);
    filter: blur(22px);
    animation: sk1 38s ease-in-out infinite;
  }
  .sk-f2 {
    width: 220%; height: 170px;
    background: linear-gradient(0deg, transparent, rgba(255,255,255,0.02), transparent);
    top: 27%; left: -60%;
    transform: rotate(-4deg);
    filter: blur(28px);
    animation: sk2 46s ease-in-out infinite;
  }
  .sk-f3 {
    width: 220%; height: 210px;
    background: linear-gradient(0deg, transparent, rgba(255,255,255,0.024), transparent);
    top: 50%; left: -60%;
    transform: rotate(-4deg);
    filter: blur(20px);
    animation: sk3 32s ease-in-out infinite;
  }
  .sk-f4 {
    width: 220%; height: 150px;
    background: linear-gradient(0deg, transparent, rgba(255,255,255,0.016), transparent);
    top: 72%; left: -60%;
    transform: rotate(-4deg);
    filter: blur(32px);
    animation: sk4 54s ease-in-out infinite;
  }
  .sk-f5 {
    width: 220%; height: 190px;
    background: linear-gradient(0deg, transparent, rgba(255,255,255,0.014), transparent);
    top: 87%; left: -60%;
    transform: rotate(-4deg);
    filter: blur(25px);
    animation: sk5 42s ease-in-out infinite;
  }
  @keyframes sk1 {
    0%,100% { transform: rotate(-4deg) translateX(0); opacity: 1; }
    50%  { transform: rotate(-4deg) translateX(-55px); opacity: 0.5; }
  }
  @keyframes sk2 {
    0%,100% { transform: rotate(-4deg) translateX(0); opacity: 0.7; }
    50%  { transform: rotate(-4deg) translateX(70px); opacity: 1; }
  }
  @keyframes sk3 {
    0%,100% { transform: rotate(-4deg) translateX(0); opacity: 0.85; }
    50%  { transform: rotate(-4deg) translateX(-38px); opacity: 0.45; }
  }
  @keyframes sk4 {
    0%,100% { transform: rotate(-4deg) translateX(0); opacity: 0.65; }
    50%  { transform: rotate(-4deg) translateX(48px); opacity: 1; }
  }
  @keyframes sk5 {
    0%,100% { transform: rotate(-4deg) translateX(0); opacity: 0.55; }
    50%  { transform: rotate(-4deg) translateX(-25px); opacity: 0.85; }
  }
  /* light-mode silk: dark folds on white */
  :global([data-theme="light"]) .sk-f1 { background: linear-gradient(0deg, transparent, rgba(0,0,0,0.04), transparent); }
  :global([data-theme="light"]) .sk-f2 { background: linear-gradient(0deg, transparent, rgba(0,0,0,0.028), transparent); }
  :global([data-theme="light"]) .sk-f3 { background: linear-gradient(0deg, transparent, rgba(0,0,0,0.034), transparent); }
  :global([data-theme="light"]) .sk-f4 { background: linear-gradient(0deg, transparent, rgba(0,0,0,0.022), transparent); }
  :global([data-theme="light"]) .sk-f5 { background: linear-gradient(0deg, transparent, rgba(0,0,0,0.018), transparent); }

  /* ══════════════════════════════════════════════════════
     5. BLOBS — organic morphing shapes
  ══════════════════════════════════════════════════════ */
  .bl-wrap {
    position: absolute; inset: 0;
  }
  .bl {
    position: absolute;
    filter: blur(65px);
    will-change: transform, border-radius;
    background: #d8d8d8;
  }
  :global([data-theme="dark"]) .bl { background: #1c1c1c; }

  .bl-1 {
    width: 720px; height: 600px;
    top: -210px; left: -160px;
    opacity: 0.65;
    animation: bl1 28s ease-in-out infinite;
  }
  .bl-2 {
    width: 620px; height: 560px;
    bottom: -190px; right: -130px;
    opacity: 0.58;
    animation: bl2 34s ease-in-out infinite;
  }
  .bl-3 {
    width: 490px; height: 450px;
    top: 18%; left: 34%;
    opacity: 0.48;
    animation: bl3 22s ease-in-out infinite;
  }
  .bl-4 {
    width: 390px; height: 370px;
    bottom: 10%; left: 10%;
    opacity: 0.42;
    animation: bl4 30s ease-in-out infinite;
  }
  .bl-5 {
    width: 310px; height: 290px;
    top: 6%; right: 16%;
    opacity: 0.36;
    animation: bl5 18s ease-in-out infinite;
  }
  @keyframes bl1 {
    0%   { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translate(0,0) scale(1); }
    20%  { border-radius: 58% 42% 75% 25% / 76% 46% 54% 24%; transform: translate(55px,38px) scale(1.06); }
    40%  { border-radius: 50% 50% 33% 67% / 55% 27% 73% 45%; transform: translate(110px,-28px) scale(0.94); }
    60%  { border-radius: 33% 67% 58% 42% / 63% 68% 32% 37%; transform: translate(75px,95px) scale(1.09); }
    80%  { border-radius: 70% 30% 46% 54% / 30% 65% 35% 70%; transform: translate(18px,55px) scale(1.03); }
    100% { border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%; transform: translate(0,0) scale(1); }
  }
  @keyframes bl2 {
    0%   { border-radius: 65% 35% 27% 73% / 55% 45% 55% 45%; transform: translate(0,0) scale(1); }
    33%  { border-radius: 30% 70% 70% 30% / 30% 52% 48% 70%; transform: translate(-75px,-55px) scale(1.07); }
    66%  { border-radius: 48% 52% 40% 60% / 70% 30% 70% 30%; transform: translate(-110px,-95px) scale(1.12); }
    100% { border-radius: 65% 35% 27% 73% / 55% 45% 55% 45%; transform: translate(0,0) scale(1); }
  }
  @keyframes bl3 {
    0%   { border-radius: 50% 50% 50% 50%; transform: translate(0,0) scale(1); }
    50%  { border-radius: 40% 60% 70% 30% / 60% 40% 30% 70%; transform: translate(-75px,55px) scale(0.88); }
    100% { border-radius: 50% 50% 50% 50%; transform: translate(0,0) scale(1); }
  }
  @keyframes bl4 {
    0%   { border-radius: 55% 45% 35% 65% / 65% 35% 65% 35%; transform: translate(0,0); }
    50%  { border-radius: 35% 65% 65% 35% / 35% 65% 35% 65%; transform: translate(90px,-72px) scale(1.09); }
    100% { border-radius: 55% 45% 35% 65% / 65% 35% 65% 35%; transform: translate(0,0); }
  }
  @keyframes bl5 {
    0%   { border-radius: 45% 55% 60% 40% / 55% 45% 55% 45%; transform: translate(0,0) scale(1); }
    50%  { border-radius: 60% 40% 45% 55% / 40% 60% 40% 60%; transform: translate(-55px,38px) scale(1.14); }
    100% { border-radius: 45% 55% 60% 40% / 55% 45% 55% 45%; transform: translate(0,0) scale(1); }
  }

  /* ══════════════════════════════════════════════════════
     6. WIREFRAME — 3D perspective grid surface
  ══════════════════════════════════════════════════════ */
  .wf-scene {
    position: absolute; inset: 0;
    perspective: 950px;
    perspective-origin: 50% 32%;
    overflow: hidden;
  }
  .wf-grid {
    position: absolute;
    bottom: -120%; left: -120%; right: -120%;
    height: 320%;
    transform: rotateX(56deg);
    background-image:
      linear-gradient(rgba(150,150,150,0.13) 1px, transparent 1px),
      linear-gradient(90deg, rgba(150,150,150,0.13) 1px, transparent 1px);
    background-size: 90px 90px;
    animation: wf-scroll 12s linear infinite;
    will-change: background-position;
  }
  :global([data-theme="dark"]) .wf-grid {
    background-image:
      linear-gradient(rgba(75,75,75,0.22) 1px, transparent 1px),
      linear-gradient(90deg, rgba(75,75,75,0.22) 1px, transparent 1px);
  }
  @keyframes wf-scroll {
    from { background-position: 0 0, 0 0; }
    to   { background-position: 0 90px, 0 0; }
  }
  .wf-ft {
    position: absolute; top: 0; left: 0; right: 0; height: 38%;
    background: linear-gradient(to bottom, var(--bg), transparent);
    z-index: 1;
  }
  .wf-fb {
    position: absolute; bottom: 0; left: 0; right: 0; height: 14%;
    background: linear-gradient(to top, var(--bg), transparent);
    z-index: 1;
  }

  /* ══════════════════════════════════════════════════════
     7. SMOKE — monochrome smoke trails, cinematic
  ══════════════════════════════════════════════════════ */
  .sm-bg {
    position: absolute; inset: 0;
    background: #020202;
    overflow: hidden;
  }
  :global([data-theme="light"]) .sm-bg { background: transparent; }
  .sm-p {
    position: absolute; border-radius: 50%;
    will-change: transform, opacity;
  }
  .sm-p1 {
    width: 820px; height: 620px;
    background: radial-gradient(ellipse, rgba(100,100,100,0.11) 0%, transparent 68%);
    top: -110px; left: -210px;
    filter: blur(85px);
    animation: sm1 48s ease-in-out infinite;
  }
  .sm-p2 {
    width: 720px; height: 520px;
    background: radial-gradient(ellipse, rgba(90,90,90,0.1) 0%, transparent 68%);
    bottom: -110px; right: -160px;
    filter: blur(95px);
    animation: sm2 58s ease-in-out infinite;
  }
  .sm-p3 {
    width: 520px; height: 420px;
    background: radial-gradient(ellipse, rgba(110,110,110,0.12) 0%, transparent 68%);
    top: 18%; left: 28%;
    filter: blur(65px);
    animation: sm3 38s ease-in-out infinite;
  }
  .sm-p4 {
    width: 420px; height: 360px;
    background: radial-gradient(ellipse, rgba(85,85,85,0.1) 0%, transparent 68%);
    bottom: 13%; left: 4%;
    filter: blur(75px);
    animation: sm4 44s ease-in-out infinite;
  }
  .sm-p5 {
    width: 360px; height: 310px;
    background: radial-gradient(ellipse, rgba(95,95,95,0.09) 0%, transparent 68%);
    top: 8%; right: 8%;
    filter: blur(70px);
    animation: sm5 32s ease-in-out infinite;
  }
  .sm-p6 {
    width: 290px; height: 260px;
    background: radial-gradient(ellipse, rgba(80,80,80,0.08) 0%, transparent 68%);
    top: 43%; right: 22%;
    filter: blur(58px);
    animation: sm6 28s ease-in-out infinite;
  }
  @keyframes sm1 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.8; }
    33%  { transform: translate(95px,-55px) scale(1.16); opacity: 1; }
    66%  { transform: translate(170px,95px) scale(0.88); opacity: 0.55; }
  }
  @keyframes sm2 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.9; }
    40%  { transform: translate(-115px,-75px) scale(1.22); opacity: 0.55; }
    70%  { transform: translate(-190px,-140px) scale(1.1); opacity: 1; }
  }
  @keyframes sm3 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.75; }
    50%  { transform: translate(-75px,95px) scale(1.12); opacity: 0.45; }
  }
  @keyframes sm4 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.7; }
    50%  { transform: translate(85px,-55px) scale(1.18); opacity: 1; }
  }
  @keyframes sm5 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.6; }
    50%  { transform: translate(-65px,45px) scale(0.82); opacity: 0.9; }
  }
  @keyframes sm6 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.65; }
    50%  { transform: translate(45px,-38px) scale(1.22); opacity: 0.35; }
  }
  /* light-mode smoke: dark wisps on white */
  :global([data-theme="light"]) .sm-p1 { background: radial-gradient(ellipse, rgba(0,0,0,0.06) 0%, transparent 68%); }
  :global([data-theme="light"]) .sm-p2 { background: radial-gradient(ellipse, rgba(0,0,0,0.05) 0%, transparent 68%); }
  :global([data-theme="light"]) .sm-p3 { background: radial-gradient(ellipse, rgba(0,0,0,0.065) 0%, transparent 68%); }
  :global([data-theme="light"]) .sm-p4 { background: radial-gradient(ellipse, rgba(0,0,0,0.05) 0%, transparent 68%); }
  :global([data-theme="light"]) .sm-p5 { background: radial-gradient(ellipse, rgba(0,0,0,0.045) 0%, transparent 68%); }
  :global([data-theme="light"]) .sm-p6 { background: radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 68%); }

  /* ══════════════════════════════════════════════════════
     8. GRAIN — gradients + film grain
  ══════════════════════════════════════════════════════ */
  .gr-bg {
    position: absolute; inset: 0;
  }
  .gr-blob {
    position: absolute; border-radius: 50%;
    will-change: transform;
  }
  .gr-b1 {
    width: 920px; height: 720px;
    background: radial-gradient(ellipse, rgba(175,175,175,0.13) 0%, transparent 68%);
    top: -210px; left: -110px;
    filter: blur(85px);
    animation: gr1 42s ease-in-out infinite;
  }
  .gr-b2 {
    width: 720px; height: 620px;
    background: radial-gradient(ellipse, rgba(155,155,155,0.11) 0%, transparent 68%);
    bottom: -160px; right: -90px;
    filter: blur(75px);
    animation: gr2 52s ease-in-out infinite;
  }
  .gr-b3 {
    width: 520px; height: 460px;
    background: radial-gradient(ellipse, rgba(140,140,140,0.09) 0%, transparent 68%);
    top: 28%; left: 38%;
    filter: blur(65px);
    animation: gr3 32s ease-in-out infinite;
  }
  :global([data-theme="dark"]) .gr-b1 {
    background: radial-gradient(ellipse, rgba(45,45,45,0.32) 0%, transparent 68%);
  }
  :global([data-theme="dark"]) .gr-b2 {
    background: radial-gradient(ellipse, rgba(38,38,38,0.26) 0%, transparent 68%);
  }
  :global([data-theme="dark"]) .gr-b3 {
    background: radial-gradient(ellipse, rgba(32,32,32,0.22) 0%, transparent 68%);
  }
  @keyframes gr1 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(145px,75px) scale(1.12); }
  }
  @keyframes gr2 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(-95px,-55px) scale(1.14); }
  }
  @keyframes gr3 {
    0%,100% { transform: translate(0,0) scale(1); }
    50%  { transform: translate(-75px,95px) scale(0.88); }
  }
  .gr-noise {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  /* ══════════════════════════════════════════════════════
     9. PARTICLES — flow field
  ══════════════════════════════════════════════════════ */
  .pt-canvas {
    position: absolute; inset: 0;
    width: 100%; height: 100%;
  }

  /* ══════════════════════════════════════════════════════
     10. FOG — volumetric fog + light beams
  ══════════════════════════════════════════════════════ */
  .fg-bg {
    position: absolute; inset: 0;
    background: #020305;
    overflow: hidden;
  }
  :global([data-theme="light"]) .fg-bg { background: transparent; }
  .fg-c {
    position: absolute; border-radius: 50%;
    will-change: transform, opacity;
  }
  .fg-c1 {
    width: 1050px; height: 520px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.042) 0%, transparent 68%);
    top: -110px; left: -320px;
    filter: blur(105px);
    animation: fc1 65s ease-in-out infinite;
  }
  .fg-c2 {
    width: 840px; height: 420px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.036) 0%, transparent 68%);
    bottom: -90px; right: -220px;
    filter: blur(95px);
    animation: fc2 80s ease-in-out infinite;
  }
  .fg-c3 {
    width: 640px; height: 370px;
    background: radial-gradient(ellipse, rgba(255,255,255,0.028) 0%, transparent 68%);
    top: 32%; left: 22%;
    filter: blur(85px);
    animation: fc3 50s ease-in-out infinite;
  }
  @keyframes fc1 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.75; }
    50%  { transform: translate(190px,75px) scale(1.18); opacity: 1; }
  }
  @keyframes fc2 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.85; }
    50%  { transform: translate(-150px,-95px) scale(1.22); opacity: 0.55; }
  }
  @keyframes fc3 {
    0%,100% { transform: translate(0,0) scale(1); opacity: 0.65; }
    50%  { transform: translate(-90px,75px) scale(0.82); opacity: 1; }
  }
  .fg-bm {
    position: absolute;
    will-change: transform, opacity;
    transform-origin: top center;
  }
  .fg-bm1 {
    width: 3px; height: 125%;
    top: -12%; left: 38%;
    background: linear-gradient(to bottom,
      transparent 0%, rgba(255,255,255,0.055) 35%,
      rgba(255,255,255,0.075) 60%, transparent 100%);
    filter: blur(7px);
    transform: rotate(13deg);
    animation: fb1 22s ease-in-out infinite;
  }
  .fg-bm2 {
    width: 2px; height: 115%;
    top: -6%; left: 57%;
    background: linear-gradient(to bottom,
      transparent 0%, rgba(255,255,255,0.038) 30%,
      rgba(255,255,255,0.055) 65%, transparent 100%);
    filter: blur(9px);
    transform: rotate(9deg);
    animation: fb2 28s ease-in-out infinite;
  }
  .fg-bm3 {
    width: 2px; height: 135%;
    top: -18%; left: 22%;
    background: linear-gradient(to bottom,
      transparent 0%, rgba(255,255,255,0.028) 25%,
      rgba(255,255,255,0.045) 70%, transparent 100%);
    filter: blur(11px);
    transform: rotate(19deg);
    animation: fb3 35s ease-in-out infinite;
  }
  @keyframes fb1 {
    0%,100% { opacity: 0.65; transform: rotate(13deg); }
    50%  { opacity: 1; transform: rotate(15deg); }
  }
  @keyframes fb2 {
    0%,100% { opacity: 0.45; transform: rotate(9deg); }
    50%  { opacity: 0.75; transform: rotate(7deg); }
  }
  @keyframes fb3 {
    0%,100% { opacity: 0.35; transform: rotate(19deg); }
    50%  { opacity: 0.65; transform: rotate(21deg); }
  }
  /* light-mode fog: dark clouds + dark beams on white */
  :global([data-theme="light"]) .fg-c1 { background: radial-gradient(ellipse, rgba(0,0,0,0.05) 0%, transparent 68%); }
  :global([data-theme="light"]) .fg-c2 { background: radial-gradient(ellipse, rgba(0,0,0,0.04) 0%, transparent 68%); }
  :global([data-theme="light"]) .fg-c3 { background: radial-gradient(ellipse, rgba(0,0,0,0.032) 0%, transparent 68%); }
  :global([data-theme="light"]) .fg-bm1 { background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.055) 60%, transparent 100%); }
  :global([data-theme="light"]) .fg-bm2 { background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.028) 30%, rgba(0,0,0,0.04) 65%, transparent 100%); }
  :global([data-theme="light"]) .fg-bm3 { background: linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.02) 25%, rgba(0,0,0,0.032) 70%, transparent 100%); }
</style>
