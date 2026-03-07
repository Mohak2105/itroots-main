'use client';
import React from 'react';
import styles from './HeroVisuals.module.css';

/* ═══ JAVA ═══ */
export const JavaVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 420" fill="none" className={styles.svg}>
      <defs>
        <linearGradient id="jG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="rgba(255,255,255,.7)" /><stop offset="100%" stopColor="rgba(220,238,250,.5)" /></linearGradient>
        <filter id="jB"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
      </defs>
      {/* dot grid */}
      {Array.from({ length: 9 }).map((_, r) => Array.from({ length: 10 }).map((_, c) => <circle key={`${r}${c}`} cx={8 + c * 50} cy={8 + r * 50} r="1.2" fill="rgba(6,100,194,.12)" />))}
      {/* browser window */}
      <rect x="20" y="20" width="260" height="160" rx="12" fill="url(#jG)" stroke="rgba(6,100,194,.25)" strokeWidth="1.5" />
      <rect x="20" y="20" width="260" height="30" rx="12" fill="rgba(6,100,194,.06)" />
      <rect x="20" y="38" width="260" height="12" fill="rgba(6,100,194,.06)" />
      <circle cx="38" cy="35" r="4" fill="rgba(255,95,87,.7)" /><circle cx="50" cy="35" r="4" fill="rgba(255,189,46,.7)" /><circle cx="62" cy="35" r="4" fill="rgba(40,200,64,.7)" />
      <rect x="36" y="60" width="60" height="6" rx="3" fill="rgba(6,100,194,.18)" />
      <rect x="104" y="60" width="90" height="6" rx="3" fill="rgba(6,100,194,.1)" />
      <rect x="36" y="76" width="220" height="5" rx="2.5" fill="rgba(6,100,194,.07)" />
      <rect x="36" y="88" width="180" height="5" rx="2.5" fill="rgba(6,100,194,.07)" />
      <rect x="36" y="108" width="70" height="44" rx="8" fill="rgba(8,129,236,.06)" stroke="rgba(8,129,236,.15)" strokeWidth="1" />
      <rect x="116" y="108" width="70" height="44" rx="8" fill="rgba(8,129,236,.06)" stroke="rgba(8,129,236,.15)" strokeWidth="1" />
      <rect x="196" y="108" width="70" height="44" rx="8" fill="rgba(8,129,236,.06)" stroke="rgba(8,129,236,.15)" strokeWidth="1" />
      {/* code panel */}
      <rect x="180" y="220" width="280" height="170" rx="12" fill="rgba(14,26,54,.88)" stroke="rgba(8,129,236,.25)" strokeWidth="1.5" />
      <rect x="180" y="220" width="280" height="28" rx="12" fill="rgba(8,129,236,.1)" />
      <rect x="180" y="236" width="280" height="12" fill="rgba(8,129,236,.1)" />
      <circle cx="196" cy="234" r="4" fill="rgba(255,95,87,.8)" /><circle cx="208" cy="234" r="4" fill="rgba(255,189,46,.8)" /><circle cx="220" cy="234" r="4" fill="rgba(40,200,64,.8)" />
      {[0, 1, 2, 3, 4, 5].map(i => <React.Fragment key={i}><rect x="186" y={260 + i * 16} width="7" height="4" rx="2" fill="rgba(255,255,255,.08)" /><rect x="198" y={260 + i * 16} width={30 + Math.random() * 40} height="4" rx="2" fill={i % 2 === 0 ? "rgba(100,180,255,.5)" : "rgba(8,129,236,.4)"} /><rect x={234 + Math.random() * 20} y={260 + i * 16} width={50 + Math.random() * 60} height="4" rx="2" fill="rgba(255,255,255,.1)" /></React.Fragment>)}
      {/* stat cards */}
      <rect x="20" y="230" width="140" height="60" rx="10" fill="url(#jG)" stroke="rgba(6,100,194,.2)" strokeWidth="1.5" />
      <rect x="34" y="244" width="44" height="6" rx="3" fill="rgba(6,100,194,.25)" />
      <rect x="34" y="258" width="80" height="18" rx="5" fill="rgba(8,129,236,.08)" />
      <rect x="20" y="302" width="140" height="60" rx="10" fill="url(#jG)" stroke="rgba(6,100,194,.2)" strokeWidth="1.5" />
      <rect x="34" y="316" width="44" height="6" rx="3" fill="rgba(6,100,194,.25)" />
      <rect x="34" y="330" width="100" height="7" rx="3.5" fill="rgba(6,100,194,.06)" />
      <rect x="34" y="330" width="68" height="7" rx="3.5" fill="rgba(8,129,236,.4)" />
      {/* connectors */}
      <path d="M160 100 C160 170,180 180,180 220" stroke="rgba(8,129,236,.2)" strokeWidth="1.5" strokeDasharray="5 4" />
      <path d="M160 260 L180 260" stroke="rgba(8,129,236,.15)" strokeWidth="1.5" strokeDasharray="4 4" />
      {/* animated dots */}
      <circle r="3.5" fill="#0881ec" filter="url(#jB)"><animateMotion dur="2.5s" repeatCount="indefinite" path="M160 100 C160 170,180 180,180 220" /></circle>
      <circle r="3" fill="#0881ec" filter="url(#jB)"><animateMotion dur="2s" repeatCount="indefinite" path="M160 260 L180 260" /></circle>
      {/* corner brackets */}
      <path d="M450 8 L472 8 L472 30" stroke="rgba(8,129,236,.2)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M8 390 L8 412 L30 412" stroke="rgba(8,129,236,.15)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  </div>
);

/* ═══ CYBER SECURITY ═══ */
export const CyberVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 440" fill="none" className={styles.svg}>
      <defs>
        <radialGradient id="cG" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#0881ec" stopOpacity=".15" /><stop offset="100%" stopColor="#0881ec" stopOpacity="0" /></radialGradient>
        <filter id="cB"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <g transform="translate(240,220)">
        <circle r="170" fill="none" stroke="rgba(8,129,236,.04)" strokeWidth="1" strokeDasharray="8 8" />
        <circle r="130" fill="none" stroke="rgba(8,129,236,.06)" strokeWidth="1" />
        <circle r="130" fill="none" stroke="#0881ec" strokeWidth="2" strokeDasharray="40 200" className={styles.radarSweep} />
        <circle r="45" fill="url(#cG)" />
        <path d="M-22-12 L22-12 L22 8 C22 22 0 30-22 8Z" fill="none" stroke="#0881ec" strokeWidth="2.5" />
        <path d="M-10 0 L0 8 L10 0" stroke="#0881ec" strokeWidth="2" strokeLinecap="round" />
        <circle r="3.5" fill="#0881ec" className={styles.pulse} />
      </g>
      {/* nodes */}
      <g transform="translate(90,90)">
        <rect x="-28" y="-28" width="56" height="56" rx="12" fill="white" stroke="rgba(8,129,236,.15)" strokeWidth="1.5" />
        <circle r="3" cx="-10" cy="-10" fill="#ef4444" /><rect x="-14" y="0" width="28" height="2" rx="1" fill="rgba(0,0,0,.08)" /><rect x="-14" y="7" width="18" height="2" rx="1" fill="rgba(0,0,0,.08)" />
        <text x="0" y="42" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">ENDPOINT</text>
      </g>
      <g transform="translate(390,100)">
        <path d="M-22 8 Q-30 8-30-4 Q-30-22-12-22 Q-8-30 4-30 Q22-30 22-12 Q30-12 30 4 Q30 12 18 12L-18 12Z" fill="white" stroke="rgba(8,129,236,.15)" strokeWidth="1.5" />
        <circle r="2.5" cx="0" cy="-4" fill="#22c55e" className={styles.pulse} />
        <text x="0" y="30" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">CLOUD SEC</text>
      </g>
      <g transform="translate(370,370)">
        <rect x="-22" y="-26" width="44" height="52" rx="4" fill="white" stroke="rgba(8,129,236,.15)" strokeWidth="1.5" />
        <circle r="10" fill="none" stroke="rgba(0,0,0,.08)" strokeWidth="2" /><rect x="-1.5" y="-7" width="3" height="14" fill="rgba(0,0,0,.08)" />
        <text x="0" y="40" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">DATA VAULT</text>
      </g>
      <g transform="translate(110,370)">
        <rect x="-18" y="-18" width="36" height="36" fill="white" stroke="rgba(8,129,236,.15)" strokeWidth="1.5" />
        <path d="M-18-8 L18-8 M-18 0 L18 0 M-18 8 L18 8 M-8-18 L-8 18 M0-18 L0 18 M8-18 L8 18" stroke="rgba(0,0,0,.04)" strokeWidth="1" />
        <text x="0" y="32" textAnchor="middle" fontSize="9" fontWeight="700" fill="#64748b">FIREWALL</text>
      </g>
      {/* connections */}
      <g stroke="rgba(8,129,236,.15)" strokeWidth="1.5" strokeDasharray="5 5">
        <path d="M118 118 L210 196" /><path d="M362 126 L270 196" /><path d="M138 350 L210 244" /><path d="M342 348 L270 244" />
      </g>
      <circle r="3" fill="#0881ec" filter="url(#cB)"><animateMotion dur="3s" repeatCount="indefinite" path="M118 118 L210 196" /></circle>
      <circle r="3" fill="#ef4444" filter="url(#cB)"><animateMotion dur="4s" repeatCount="indefinite" path="M362 126 L270 196" /></circle>
      <circle r="3" fill="#22c55e" filter="url(#cB)"><animateMotion dur="5s" repeatCount="indefinite" path="M138 350 L210 244" /></circle>
    </svg>
    <div className={`${styles.alertBadge} ${styles.alert1}`}><div className={styles.alertDot} /><span>SQLi Blocked</span></div>
    <div className={`${styles.alertBadge} ${styles.alert2}`}><div className={styles.alertDotGreen} /><span>Zero-Day Patched</span></div>
  </div>
);

/* ═══ AI ═══ */
export const AIVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 440" fill="none" className={styles.svg}>
      <defs>
        <filter id="aB"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>
      <g stroke="rgba(129,140,248,.12)" strokeWidth="1">
        <line x1="90" y1="80" x2="230" y2="40" /><line x1="90" y1="80" x2="230" y2="130" />
        <line x1="90" y1="220" x2="230" y2="130" /><line x1="90" y1="220" x2="230" y2="300" />
        <line x1="90" y1="360" x2="230" y2="300" /><line x1="90" y1="360" x2="230" y2="390" />
        <line x1="230" y1="40" x2="370" y2="130" /><line x1="230" y1="130" x2="370" y2="130" />
        <line x1="230" y1="130" x2="370" y2="260" /><line x1="230" y1="300" x2="370" y2="260" />
        <line x1="230" y1="300" x2="370" y2="390" /><line x1="230" y1="390" x2="370" y2="390" />
        <line x1="370" y1="130" x2="450" y2="220" /><line x1="370" y1="260" x2="450" y2="220" />
        <line x1="90" y1="80" x2="20" y2="220" /><line x1="90" y1="220" x2="20" y2="220" /><line x1="90" y1="360" x2="20" y2="220" />
      </g>
      {/* nodes */}
      {[[90, 80, 3.5, "#818cf8"], [90, 220, 3.5, "#818cf8"], [90, 360, 3.5, "#818cf8"], [230, 40, 5, "#6366f1"], [230, 130, 5, "#6366f1"], [230, 300, 5, "#6366f1"], [230, 390, 5, "#6366f1"], [370, 130, 4.5, "#4f46e5"], [370, 260, 4.5, "#4f46e5"], [450, 220, 7, "#4338ca"], [20, 220, 7, "#c7d2fe"]].map(([x, y, r, c], i) => <circle key={i} cx={x as number} cy={y as number} r={r as number} fill={c as string} className={styles.pulse} />)}
      {/* particles */}
      <circle r="2.5" fill="#fff" filter="url(#aB)"><animateMotion dur="3s" repeatCount="indefinite" path="M90 80 L230 130 L370 260 L450 220" /></circle>
      <circle r="2.5" fill="#fff" filter="url(#aB)"><animateMotion dur="4s" repeatCount="indefinite" begin="1s" path="M90 360 L230 300 L370 130 L230 40" /></circle>
      <circle r="3" fill="#818cf8" opacity=".3"><animate attributeName="r" values="3;14;3" dur="2s" repeatCount="indefinite" /><animate attributeName="cx" values="450" dur="2s" repeatCount="indefinite" /><animate attributeName="cy" values="220" dur="2s" repeatCount="indefinite" /></circle>
    </svg>
    <div className={`${styles.chipBadge} ${styles.chipAI1}`}>LLM Integrated</div>
    <div className={`${styles.chipBadge} ${styles.chipAI2}`}>AWS Bedrock</div>
  </div>
);

/* ═══ TESTING ═══ */
export const TestingVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 440" fill="none" className={styles.svg}>
      <defs><filter id="tB"><feGaussianBlur stdDeviation="2" /></filter></defs>
      {/* terminal window */}
      <rect x="40" y="30" width="400" height="260" rx="14" fill="rgba(14,26,54,.9)" stroke="rgba(168,85,247,.2)" strokeWidth="1.5" />
      <rect x="40" y="30" width="400" height="30" rx="14" fill="rgba(168,85,247,.08)" />
      <rect x="40" y="48" width="400" height="12" fill="rgba(168,85,247,.08)" />
      <circle cx="58" cy="45" r="4" fill="rgba(255,95,87,.8)" /><circle cx="70" cy="45" r="4" fill="rgba(255,189,46,.8)" /><circle cx="82" cy="45" r="4" fill="rgba(40,200,64,.8)" />
      <text x="240" y="48" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.3)" fontFamily="monospace">test_runner.sh</text>
      {/* test lines */}
      {["✓ Login flow validated", "✓ API response 200 OK", "✓ Form validation pass", "✗ Edge case #47 failed", "✓ Regression suite done", "✓ Performance &lt; 200ms"].map((t, i) => (
        <React.Fragment key={i}>
          <text x="60" y={82 + i * 30} fontSize="11" fontFamily="monospace" fill={t.startsWith("✗") ? "#ef4444" : "#22c55e"} className={styles.typeIn} style={{ animationDelay: `${i * .6}s` }}>{t}</text>
          <rect x="60" y={86 + i * 30} width="320" height="1" fill="rgba(255,255,255,.03)" />
        </React.Fragment>
      ))}
      {/* blinking cursor */}
      <rect x="60" y={82 + 6 * 30} width="8" height="14" fill="#a855f7" className={styles.blink} />
      {/* bottom stats */}
      <g transform="translate(60,320)">
        <rect width="120" height="80" rx="10" fill="white" stroke="rgba(168,85,247,.15)" strokeWidth="1.5" />
        <text x="60" y="30" textAnchor="middle" fontSize="22" fontWeight="800" fill="#22c55e">98%</text>
        <text x="60" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">PASS RATE</text>
        <rect x="15" y="60" width="90" height="6" rx="3" fill="#f1f5f9" /><rect x="15" y="60" width="82" height="6" rx="3" fill="#22c55e" />
      </g>
      <g transform="translate(200,320)">
        <rect width="120" height="80" rx="10" fill="white" stroke="rgba(168,85,247,.15)" strokeWidth="1.5" />
        <text x="60" y="30" textAnchor="middle" fontSize="22" fontWeight="800" fill="#ef4444">2</text>
        <text x="60" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">BUGS FOUND</text>
      </g>
      <g transform="translate(340,320)">
        <rect width="120" height="80" rx="10" fill="white" stroke="rgba(168,85,247,.15)" strokeWidth="1.5" />
        <text x="60" y="30" textAnchor="middle" fontSize="22" fontWeight="800" fill="#a855f7">124</text>
        <text x="60" y="50" textAnchor="middle" fontSize="9" fontWeight="600" fill="#64748b">TESTS RUN</text>
      </g>
    </svg>
  </div>
);

/* ═══ DOT NET ═══ */
export const DotNetVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 400" fill="none" className={styles.svg}>
      <defs><filter id="dB"><feGaussianBlur stdDeviation="3" /></filter></defs>
      {/* 3-tier architecture */}
      {[{ y: 30, label: "🌐  ASP.NET Core MVC", sub: "Razor Views • Controllers" }, { y: 160, label: "⚙️  Business Logic API", sub: "Services • DTOs • Middleware" }, { y: 290, label: "🗄️  SQL Server + EF Core", sub: "Migrations • Repositories" }].map((t, i) => (
        <g key={i} transform={`translate(80,${t.y})`}>
          <rect width="320" height="90" rx="14" fill="white" stroke="rgba(185,28,28,.15)" strokeWidth="1.5" />
          <text x="160" y="38" textAnchor="middle" fontSize="13" fontWeight="800" fill="#991b1b">{t.label}</text>
          <text x="160" y="58" textAnchor="middle" fontSize="10" fill="#a1a1aa">{t.sub}</text>
          <rect x="12" y="70" width="50" height="6" rx="3" fill={`rgba(185,28,28,${.08 + i * .04})`} />
          <rect x="70" y="70" width="40" height="6" rx="3" fill={`rgba(185,28,28,${.06 + i * .03})`} />
        </g>
      ))}
      {/* connectors */}
      <path d="M240 120 L240 160" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 5" opacity=".25" />
      <path d="M240 250 L240 290" stroke="#dc2626" strokeWidth="2" strokeDasharray="5 5" opacity=".25" />
      {/* animated packets */}
      <circle r="4" fill="#dc2626" filter="url(#dB)"><animateMotion dur="2s" repeatCount="indefinite" path="M240 120 L240 160" /></circle>
      <circle r="4" fill="#dc2626" filter="url(#dB)"><animateMotion dur="2.5s" repeatCount="indefinite" path="M240 250 L240 290" /></circle>
      <circle r="4" fill="#22c55e" filter="url(#dB)"><animateMotion dur="2s" repeatCount="indefinite" path="M240 290 L240 250" /></circle>
      {/* side labels */}
      <text x="440" y="78" fontSize="9" fill="#a1a1aa" fontWeight="600" transform="rotate(90,440,78)">PRESENTATION</text>
      <text x="440" y="208" fontSize="9" fill="#a1a1aa" fontWeight="600" transform="rotate(90,440,208)">APPLICATION</text>
      <text x="440" y="338" fontSize="9" fill="#a1a1aa" fontWeight="600" transform="rotate(90,440,338)">DATA LAYER</text>
    </svg>
  </div>
);

/* ═══ BA ═══ */
export const BAVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 380" fill="none" className={styles.svg}>
      <defs><filter id="bB"><feGaussianBlur stdDeviation="2.5" /></filter></defs>
      {/* process flow */}
      {[{ x: 60, icon: "📋", label: "Discover" }, { x: 190, icon: "🔍", label: "Analyze" }, { x: 320, icon: "📊", label: "Model" }, { x: 420, icon: "🚀", label: "Deliver" }].map((s, i) => (
        <g key={i} transform={`translate(${s.x},60)`}>
          <rect x="-36" y="-36" width="72" height="72" rx="16" fill="white" stroke="rgba(99,102,241,.15)" strokeWidth="1.5" />
          <text x="0" y="4" textAnchor="middle" fontSize="22">{s.icon}</text>
          <text x="0" y="54" textAnchor="middle" fontSize="10" fontWeight="700" fill="#4f46e5">{s.label}</text>
        </g>
      ))}
      {/* connector arrows */}
      <path d="M96 60 L154 60" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="5 5" opacity=".3" markerEnd="url(#arrow)" />
      <path d="M226 60 L284 60" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="5 5" opacity=".3" />
      <path d="M356 60 L384 60" stroke="#6366f1" strokeWidth="1.5" strokeDasharray="5 5" opacity=".3" />
      <circle r="3" fill="#6366f1" filter="url(#bB)"><animateMotion dur="3s" repeatCount="indefinite" path="M96 60 L154 60 L226 60 L284 60 L356 60 L384 60" /></circle>
      {/* dashboard wireframe */}
      <rect x="40" y="150" width="400" height="200" rx="14" fill="white" stroke="rgba(99,102,241,.12)" strokeWidth="1.5" />
      <rect x="40" y="150" width="400" height="28" rx="14" fill="rgba(99,102,241,.04)" />
      <rect x="40" y="166" width="400" height="12" fill="rgba(99,102,241,.04)" />
      <circle cx="58" cy="164" r="4" fill="rgba(255,95,87,.6)" /><circle cx="70" cy="164" r="4" fill="rgba(255,189,46,.6)" /><circle cx="82" cy="164" r="4" fill="rgba(40,200,64,.6)" />
      {/* mini charts */}
      {[0, 1, 2].map(i => <g key={i} transform={`translate(${60 + i * 135},195)`}>
        <rect width="110" height="70" rx="8" fill="rgba(99,102,241,.03)" stroke="rgba(99,102,241,.08)" strokeWidth="1" />
        <rect x="10" y="50" width="14" height="12" rx="2" fill="rgba(99,102,241,.15)" />
        <rect x="28" y="38" width="14" height="24" rx="2" fill="rgba(99,102,241,.2)" />
        <rect x="46" y="30" width="14" height="32" rx="2" fill="rgba(99,102,241,.25)" />
        <rect x="64" y="42" width="14" height="20" rx="2" fill="rgba(99,102,241,.18)" />
        <rect x="82" y="20" width="14" height="42" rx="2" fill="#6366f1" opacity=".4" />
      </g>)}
      {/* KPI row */}
      <rect x="60" y="280" width="80" height="50" rx="8" fill="rgba(99,102,241,.04)" />
      <text x="100" y="308" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6366f1">94%</text>
      <text x="100" y="322" textAnchor="middle" fontSize="8" fill="#94a3b8">Accuracy</text>
      <rect x="160" y="280" width="80" height="50" rx="8" fill="rgba(99,102,241,.04)" />
      <text x="200" y="308" textAnchor="middle" fontSize="16" fontWeight="800" fill="#6366f1">12K</text>
      <text x="200" y="322" textAnchor="middle" fontSize="8" fill="#94a3b8">Records</text>
    </svg>
  </div>
);

/* ═══ DA ═══ */
export const DAVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 400" fill="none" className={styles.svg}>
      <defs><filter id="daB"><feGaussianBlur stdDeviation="2.5" /></filter></defs>
      {/* data sources */}
      {[{ x: 80, l: "SQL" }, { x: 240, l: "Excel" }, { x: 400, l: "Cloud" }].map((s, i) => (
        <g key={i} transform={`translate(${s.x},50)`}>
          <rect x="-32" y="-24" width="64" height="48" rx="10" fill="white" stroke="rgba(16,185,129,.15)" strokeWidth="1.5" />
          <text x="0" y="5" textAnchor="middle" fontSize="11" fontWeight="700" fill="#059669">{s.l}</text>
        </g>
      ))}
      {/* funnel lines */}
      <path d="M80 74 L240 140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity=".25" />
      <path d="M240 74 L240 140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity=".25" />
      <path d="M400 74 L240 140" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity=".25" />
      {/* ETL core */}
      <g transform="translate(240,170)">
        <circle r="35" fill="rgba(16,185,129,.06)" stroke="rgba(16,185,129,.2)" strokeWidth="1.5" />
        <circle r="35" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="20 80" className={styles.radarSweep} />
        <text x="0" y="5" textAnchor="middle" fontSize="10" fontWeight="700" fill="#059669">ETL</text>
      </g>
      <circle r="3" fill="#10b981" filter="url(#daB)"><animateMotion dur="2s" repeatCount="indefinite" path="M80 74 L240 140" /></circle>
      <circle r="3" fill="#10b981" filter="url(#daB)"><animateMotion dur="2.5s" repeatCount="indefinite" path="M400 74 L240 140" /></circle>
      {/* output viz */}
      <path d="M240 210 L120 280" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity=".2" />
      <path d="M240 210 L360 280" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" opacity=".2" />
      {/* bar chart card */}
      <g transform="translate(50,270)">
        <rect width="140" height="100" rx="12" fill="white" stroke="rgba(16,185,129,.12)" strokeWidth="1.5" />
        {[18, 30, 22, 38, 28, 34].map((h, i) => <rect key={i} x={16 + i * 18} y={80 - h} width="12" height={h} rx="3" fill={`rgba(16,185,129,${.2 + i * .08})`} />)}
        <text x="70" y="96" textAnchor="middle" fontSize="8" fill="#94a3b8">Bar Chart</text>
      </g>
      {/* donut chart card */}
      <g transform="translate(290,270)">
        <rect width="140" height="100" rx="12" fill="white" stroke="rgba(16,185,129,.12)" strokeWidth="1.5" />
        <circle cx="70" cy="48" r="28" fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx="70" cy="48" r="28" fill="none" stroke="#10b981" strokeWidth="6" strokeDasharray="130" strokeDashoffset="35" strokeLinecap="round" />
        <text x="70" y="52" textAnchor="middle" fontSize="12" fontWeight="800" fill="#059669">73%</text>
        <text x="70" y="96" textAnchor="middle" fontSize="8" fill="#94a3b8">Insights</text>
      </g>
    </svg>
  </div>
);

/* ═══ DA PYTHON ═══ */
export const DAPythonVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 420" fill="none" className={styles.svg}>
      <defs><filter id="dpB"><feGaussianBlur stdDeviation="2" /></filter></defs>
      {/* code editor */}
      <rect x="30" y="20" width="280" height="220" rx="14" fill="rgba(14,26,54,.92)" stroke="rgba(55,118,171,.25)" strokeWidth="1.5" />
      <rect x="30" y="20" width="280" height="28" rx="14" fill="rgba(55,118,171,.1)" />
      <rect x="30" y="36" width="280" height="12" fill="rgba(55,118,171,.1)" />
      <circle cx="46" cy="34" r="4" fill="rgba(255,95,87,.8)" /><circle cx="58" cy="34" r="4" fill="rgba(255,189,46,.8)" /><circle cx="70" cy="34" r="4" fill="rgba(40,200,64,.8)" />
      <text x="180" y="37" textAnchor="middle" fontSize="9" fill="rgba(255,255,255,.25)" fontFamily="monospace">analysis.py</text>
      {/* code lines */}
      <text x="48" y="72" fontSize="10" fontFamily="monospace" fill="#34d399">import</text>
      <text x="96" y="72" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.7)">pandas</text>
      <text x="146" y="72" fontSize="10" fontFamily="monospace" fill="#34d399">as</text>
      <text x="162" y="72" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.7)">pd</text>
      <text x="48" y="94" fontSize="10" fontFamily="monospace" fill="#34d399">import</text>
      <text x="96" y="94" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.7)">matplotlib.pyplot</text>
      <text x="48" y="118" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">df = pd.read_csv(</text>
      <text x="192" y="118" fontSize="10" fontFamily="monospace" fill="#3776ab">&apos;data.csv&apos;</text>
      <text x="260" y="118" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">)</text>
      <text x="48" y="142" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">df.groupby(</text>
      <text x="136" y="142" fontSize="10" fontFamily="monospace" fill="#3776ab">&apos;region&apos;</text>
      <text x="192" y="142" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">).mean()</text>
      <text x="48" y="166" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">plt.bar(df.index, df.sales)</text>
      <text x="48" y="190" fontSize="10" fontFamily="monospace" fill="rgba(255,255,255,.6)">plt.show()</text>
      <rect x="48" y="200" width="8" height="13" fill="#3776ab" className={styles.blink} />
      {/* line chart card */}
      <g transform="translate(180,260)">
        <rect width="270" height="140" rx="14" fill="white" stroke="rgba(55,118,171,.15)" strokeWidth="1.5" />
        <text x="135" y="24" textAnchor="middle" fontSize="10" fontWeight="700" fill="#1e3a5f">Matplotlib Output</text>
        <path d="M20 110 L250 110 M20 40 L20 110" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
        <path d="M25 90 L60 55 L95 70 L130 40 L165 80 L200 50 L240 65" stroke="#3776ab" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <animate attributeName="stroke-dasharray" from="0,600" to="600,0" dur="3s" repeatCount="indefinite" />
        </path>
        {[25, 60, 95, 130, 165, 200, 240].map((x, i) => <circle key={i} cx={x} cy={[90, 55, 70, 40, 80, 50, 65][i]} r="3" fill="#3776ab" opacity=".5" />)}
        <text x="135" y="128" textAnchor="middle" fontSize="8" fill="#94a3b8">df.plot(kind=&apos;line&apos;)</text>
      </g>
      {/* python badge */}
      <g transform="translate(30,280)">
        <rect width="130" height="50" rx="10" fill="white" stroke="rgba(55,118,171,.12)" strokeWidth="1.5" />
        <text x="65" y="22" textAnchor="middle" fontSize="18">🐍</text>
        <text x="65" y="40" textAnchor="middle" fontSize="9" fontWeight="700" fill="#1e3a5f">Python 3.12</text>
      </g>
    </svg>
  </div>
);

/* ═══ HR ═══ */
export const HRVisual = () => (
  <div className={styles.panel}>
    <svg viewBox="0 0 480 400" fill="none" className={styles.svg}>
      <defs><filter id="hB"><feGaussianBlur stdDeviation="2.5" /></filter></defs>
      {/* central hub */}
      <g transform="translate(240,180)">
        <circle r="50" fill="rgba(20,184,166,.06)" stroke="rgba(20,184,166,.2)" strokeWidth="1.5" />
        <circle r="50" fill="none" stroke="#14b8a6" strokeWidth="2" strokeDasharray="20 100" className={styles.radarSweep} />
        <text x="0" y="-4" textAnchor="middle" fontSize="11" fontWeight="800" fill="#0f766e">HR</text>
        <text x="0" y="10" textAnchor="middle" fontSize="9" fontWeight="600" fill="#5eead4">CORE</text>
      </g>
      {/* spoke nodes */}
      {[{ x: 100, y: 60, icon: "👥", label: "Talent" }, { x: 380, y: 60, icon: "💰", label: "Payroll" }, { x: 420, y: 240, icon: "📊", label: "Analytics" }, { x: 340, y: 360, icon: "🎯", label: "L&D" }, { x: 140, y: 360, icon: "🏢", label: "Culture" }, { x: 60, y: 240, icon: "📋", label: "Compliance" }].map((n, i) => (
        <g key={i}>
          <line x1="240" y1="180" x2={n.x} y2={n.y} stroke="rgba(20,184,166,.1)" strokeWidth="1.5" strokeDasharray="5 5" />
          <g transform={`translate(${n.x},${n.y})`}>
            <rect x="-32" y="-28" width="64" height="56" rx="12" fill="white" stroke="rgba(20,184,166,.15)" strokeWidth="1.5" />
            <text x="0" y="-2" textAnchor="middle" fontSize="18">{n.icon}</text>
            <text x="0" y="16" textAnchor="middle" fontSize="9" fontWeight="700" fill="#0f766e">{n.label}</text>
          </g>
        </g>
      ))}
      {/* animated particles */}
      <circle r="3" fill="#14b8a6" filter="url(#hB)"><animateMotion dur="3s" repeatCount="indefinite" path="M240 180 L100 60" /></circle>
      <circle r="3" fill="#14b8a6" filter="url(#hB)"><animateMotion dur="4s" repeatCount="indefinite" path="M240 180 L380 60" /></circle>
      <circle r="3" fill="#14b8a6" filter="url(#hB)"><animateMotion dur="3.5s" repeatCount="indefinite" path="M240 180 L420 240" /></circle>
    </svg>
  </div>
);

/* ═══ DATA SCIENCE – 3D Isometric Platform Visual ═══ */
import {
  Terminal as PhTerminal,
  Brain,
  ChartBar,
  Database,
  Lightning,
  ChartLineUp,
  Robot,
  CloudArrowUp,
  Cpu,
  Circuitry,
  Code,
  Gear,
  Globe
} from '@phosphor-icons/react';

export const DSVisual = () => (
  <div className={styles.sphereContainer}>
    {/* SVG background / Globe */}
    <svg viewBox="0 0 500 500" className={styles.sphereSvg}>
      <defs>
        <radialGradient id="sphereGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.3" />
          <stop offset="70%" stopColor="#0284c7" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#38bdf8" stopOpacity="0" />
          <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
        </radialGradient>
        <pattern id="hexGrid" width="20" height="34.64" patternUnits="userSpaceOnUse" patternTransform="scale(1.2)">
          <path d="M10 0 L20 5.77 L20 17.32 L10 23.09 L0 17.32 L0 5.77 Z" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="0.8" />
        </pattern>
        <filter id="neonGlow">
          <feGaussianBlur stdDeviation="5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Core sphere backdrop */}
      <circle cx="250" cy="250" r="180" fill="url(#sphereGrad)" />
      <circle cx="250" cy="250" r="180" fill="url(#hexGrid)" />
      <circle cx="250" cy="250" r="180" fill="none" stroke="url(#ringGrad)" strokeWidth="6" />

      {/* Outer dash rings */}
      <circle cx="250" cy="250" r="220" fill="none" stroke="#0ea5e9" strokeWidth="1" strokeDasharray="4 12" className={styles.rotateSlow} />
      <circle cx="250" cy="250" r="235" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="30 60 10 60" className={styles.rotateFastReverse} />

      {/* Center Atom Orbits */}
      <g stroke="#38bdf8" strokeWidth="2.5" filter="url(#neonGlow)" className={styles.atomRotate}>
        <ellipse cx="250" cy="250" rx="45" ry="110" fill="none" />
        <ellipse cx="250" cy="250" rx="45" ry="110" fill="none" transform="rotate(60 250 250)" />
        <ellipse cx="250" cy="250" rx="45" ry="110" fill="none" transform="rotate(120 250 250)" />
      </g>
    </svg>

    {/* Center Icon (Server / DB) */}
    <div className={styles.centerNode}>
      <Database size={36} color="#e0f2fe" weight="duotone" />
    </div>

    {/* Orbiting Hexagons */}
    <div className={`${styles.hexNode} ${styles.hex1}`}>
      <div className={styles.hexInner}>
        <Code size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
    <div className={`${styles.hexNode} ${styles.hex2}`}>
      <div className={styles.hexInner}>
        <Gear size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
    <div className={`${styles.hexNode} ${styles.hex3}`}>
      <div className={styles.hexInner}>
        <CloudArrowUp size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
    <div className={`${styles.hexNode} ${styles.hex4}`}>
      <div className={styles.hexInner}>
        <Globe size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
    <div className={`${styles.hexNode} ${styles.hex5}`}>
      <div className={styles.hexInner}>
        <Cpu size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
    <div className={`${styles.hexNode} ${styles.hex6}`}>
      <div className={styles.hexInner}>
        <ChartBar size={24} color="#38bdf8" weight="duotone" />
      </div>
    </div>
  </div>
);

