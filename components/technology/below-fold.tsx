'use client'

import Link from 'next/link'
import { ArrowRight, Check, FileCheck2, Headphones, Languages, LockKeyhole, Mic2, Play, ShieldCheck, Sparkles, Volume2, Waves } from 'lucide-react'
import { useEffect, useRef, useState, type ComponentType } from 'react'

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const node = ref.current; if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.dataset.visible = 'true'; observer.disconnect() } }, { threshold: .12 }); observer.observe(node); return () => observer.disconnect() }, [])
  return <div ref={ref} className={`tech-reveal ${className}`}>{children}</div>
}

const statItems = [
  ['14M+', 'hours of telephonic audio', Headphones, 'text-teal-600'],
  ['<200ms', 'streaming latency', Waves, 'text-emerald-600'],
  ['10+', 'languages', Languages, 'text-amber-500'],
  ['30B', 'parameters', Sparkles, 'text-violet-600'],
  ['128K', 'context window', FileCheck2, 'text-indigo-600'],
  ['11', 'Indian languages natively', Mic2, 'text-teal-600'],
] as const

export function StatsBand() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [progress, setProgress] = useState(0)
  useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } }, { threshold: .25 }); observer.observe(node); return () => observer.disconnect() }, [])
  useEffect(() => { if (!visible) return; if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setProgress(1); return }; let frame = 0; const started = performance.now(); const tick = (now: number) => { const next = Math.min((now - started) / 900, 1); setProgress(next); if (next < 1) frame = requestAnimationFrame(tick) }; frame = requestAnimationFrame(tick); return () => cancelAnimationFrame(frame) }, [visible])
  const displayValue = (value: string) => { if (!visible) return '0'; if (value === '14M+') return `${Math.round(14 * progress)}M+`; if (value === '<200ms') return `<${Math.max(1, Math.round(200 * progress))}ms`; if (value === '10+') return `${Math.round(10 * progress)}+`; if (value === '30B') return `${Math.round(30 * progress)}B`; if (value === '128K') return `${Math.round(128 * progress)}K`; return `${Math.max(1, Math.round(11 * progress))}` }
  return <Reveal className="mt-20"><div ref={ref} className="tech-stats-band"><div className="tech-stat-grid-wide">{statItems.map(([value, label, Icon, color]) => <div className="tech-big-stat" key={label}><Icon className={`size-4 ${color}`} aria-hidden="true"/><strong>{displayValue(value)}</strong><span>{label}</span></div>)}</div><p className="mt-8 text-center text-xs text-slate-500 dark:text-slate-400">Figures as published by the model providers.</p></div></Reveal>
}

const bentoItems: Array<{ title: string; body: string; icon: ComponentType<{ className?: string }>; accent: string; size: string }> = [
  { title: 'Built for Indian speech', body: 'Prisma streams across Indian languages plus Hinglish, Tanglish and Benglish.', icon: Mic2, accent: 'from-teal-500 to-emerald-400', size: 'bento-large' },
  { title: 'Code-mixed understanding', body: 'The stack follows how people actually talk, including mixed-language speech.', icon: Languages, accent: 'from-indigo-500 to-violet-500', size: '' },
  { title: 'Streaming end to end', body: 'Prisma streams speech in under 200ms; Timbre streams over WebSocket and SSE.', icon: Waves, accent: 'from-cyan-500 to-teal-400', size: '' },
  { title: 'Open weights with Evon', body: 'Evon v3.3 Apache 2.0 weights are available by request on Hugging Face.', icon: Sparkles, accent: 'from-violet-500 to-fuchsia-400', size: 'bento-wide' },
  { title: 'Private by design', body: 'Your session stays focused on the conversation you asked VeriLex to check.', icon: LockKeyhole, accent: 'from-amber-400 to-rose-400', size: 'bento-wide' },
]

export function WhyBento() {
  return <Reveal className="mt-28"><section aria-labelledby="why-stack"><p className="text-xs font-bold uppercase tracking-[.22em] text-teal-700 dark:text-teal-300">Why this stack</p><h2 id="why-stack" className="mt-4 text-4xl tracking-[-.04em] sm:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>Designed for the moment<br className="hidden sm:block"/> you need clarity.</h2><div className="tech-bento-grid mt-10">{bentoItems.map(({ title, body, icon: Icon, accent, size }) => <article onMouseMove={(event) => { const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--mx', `${event.clientX - rect.left}px`); event.currentTarget.style.setProperty('--my', `${event.clientY - rect.top}px`) }} className={`tech-bento-card ${size}`} key={title}><div className={`tech-bento-icon bg-gradient-to-br ${accent}`}><Icon className="size-5" aria-hidden="true"/></div><h3>{title}</h3><p>{body}</p></article>)}</div></section></Reveal>
}

const timelineSteps = [
  ['Agent speaks', 'A promise enters the room.', Mic2],
  ['Prisma transcribes', 'Speech becomes searchable text.', Headphones],
  ['Evon verifies', 'Claims meet the document clauses.', ShieldCheck],
  ['Timbre whispers', 'A short warning is composed.', Volume2],
  ['You hear it', 'Clarity arrives before the decision.', Check],
] as const

export function WarningTimeline() {
  const ref = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  useEffect(() => { const onScroll = () => { const node = ref.current; if (!node) return; const rect = node.getBoundingClientRect(); const range = Math.max(node.offsetHeight - window.innerHeight * .65, 1); setProgress(Math.max(0, Math.min(1, (window.innerHeight * .45 - rect.top) / range))) }; window.addEventListener('scroll', onScroll, { passive: true }); onScroll(); return () => window.removeEventListener('scroll', onScroll) }, [])
  return <Reveal><section id="pipeline" ref={ref} className="tech-timeline-section" aria-labelledby="pipeline-title"><div className="text-center"><p className="text-xs font-bold uppercase tracking-[.22em] text-teal-700 dark:text-teal-300">The loop</p><h2 id="pipeline-title" className="mt-3 text-4xl tracking-[-.04em] sm:text-5xl" style={{ fontFamily: 'Georgia, serif' }}>How a warning is made</h2></div><div className="tech-timeline mt-12" style={{ '--timeline-progress': `${progress * 100}%` } as React.CSSProperties}><div className="tech-timeline-line" aria-hidden="true"/><div className="tech-timeline-steps">{timelineSteps.map(([title, caption, Icon], index) => <div className="tech-timeline-step" key={title}><div className="tech-timeline-marker"><Icon className="size-4" aria-hidden="true"/></div><div><h3>{title}</h3><p>{caption}</p></div><span className="sr-only">Step {index + 1} of 5</span></div>)}</div></div><p className="mt-10 text-center text-sm font-semibold text-slate-500 dark:text-slate-400">Target: a few seconds end to end</p></section></Reveal>
}

const languages = ['Hindi', 'Marathi', 'English', 'Hinglish', 'Tanglish', 'Benglish', '+ more']
export function LanguageMarquee() { return <Reveal className="mt-20"><section className="tech-language-marquee" aria-label="Language coverage"><div className="tech-marquee-track">{[...languages, ...languages].map((language, index) => <span key={`${language}-${index}`}>{language}</span>)}</div></section></Reveal> }

export function TechNotes() { return <Reveal className="mt-20"><aside className="tech-notes-card"><p>Model figures are as published by their providers and may change. Timbre v2.5 is currently in beta.</p><p>Evon v3.3: Apache 2.0 weights are available by request on Hugging Face.</p></aside></Reveal> }

export function TechCta() { const [playing, setPlaying] = useState(false); return <Reveal className="mt-16"><section className="tech-closing-cta"><div className="tech-cta-grid" aria-hidden="true"/><div className="tech-cta-glow" aria-hidden="true"/><div className="relative z-10"><p className="text-xs font-bold uppercase tracking-[.22em] text-teal-200">VeriLex</p><h2 className="mt-4 text-4xl tracking-[-.04em] text-white sm:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>See it work, live.</h2><div className="mt-8 flex flex-wrap gap-3"><Link href="/session/new" className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#0b1b34] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300">Start a session <ArrowRight className="size-4"/></Link><button type="button" onClick={() => setPlaying((value) => !value)} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm font-bold text-white backdrop-blur focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-300"><Play className="size-4 fill-current" aria-hidden="true"/>{playing ? 'Playing demo' : 'Watch the demo'}</button></div></div></section></Reveal> }
