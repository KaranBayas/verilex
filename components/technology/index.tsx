'use client'

import Link from 'next/link'
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, Mic2, Play, Sparkles, Speaker, Volume2 } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { AIModel } from '@/lib/models'
export { LanguageMarquee, StatsBand, TechCta, TechNotes, WarningTimeline, WhyBento } from './below-fold'

export const technologyAccents = {
  prisma: { label: 'Speech to Text', gradient: 'from-teal-500 to-emerald-400', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200/70 dark:border-teal-800/70', glow: 'rgba(20,184,166,.18)', soft: 'bg-teal-50/70 dark:bg-teal-950/30' },
  evon: { label: 'Reasoning', gradient: 'from-violet-500 to-indigo-500', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200/70 dark:border-violet-800/70', glow: 'rgba(124,92,230,.2)', soft: 'bg-violet-50/70 dark:bg-violet-950/30' },
  timbre: { label: 'Text to Speech', gradient: 'from-amber-400 to-rose-400', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200/70 dark:border-amber-800/70', glow: 'rgba(245,158,11,.2)', soft: 'bg-amber-50/70 dark:bg-amber-950/25' },
} as const

const pipeline = [
  { name: 'Prisma v2.5', action: 'Hear', icon: Mic2, accent: technologyAccents.prisma },
  { name: 'Evon v3.3', action: 'Understand', icon: Sparkles, accent: technologyAccents.evon },
  { name: 'Timbre v2.5', action: 'Speak', icon: Speaker, accent: technologyAccents.timbre },
]

function useReveal() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const node = ref.current
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { node.dataset.visible = 'true'; observer.disconnect() } }, { threshold: .14 })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return ref
}

export function TechHero() {
  return <section className="tech-hero relative overflow-hidden px-5 pb-14 pt-20 lg:px-8 lg:pb-20 lg:pt-28"><div className="tech-aurora" aria-hidden="true"><span/><span/><span/></div><div className="relative mx-auto max-w-5xl text-center"><p className="text-xs font-bold uppercase tracking-[.24em] text-teal-700 dark:text-teal-300">The technology</p><h1 className="mx-auto mt-5 max-w-4xl text-5xl leading-[.95] tracking-[-.05em] sm:text-7xl lg:text-8xl" style={{ fontFamily: 'Georgia, serif' }}>Three models. <span className="tech-gradient-text">One witness.</span></h1><p className="mx-auto mt-7 max-w-2xl text-base leading-8 text-slate-600 dark:text-slate-300 sm:text-lg">Hear. Understand. Speak. Built on Indian-language AI that understands how people actually talk.</p><div className="tech-pipeline mt-12" aria-label="VeriLex model pipeline">{pipeline.map(({ name, action, icon: Icon, accent }, index) => <div className="tech-pipeline-step" key={name}><div className="tech-pipeline-pill"><span className={`grid size-9 place-items-center rounded-xl bg-gradient-to-br ${accent.gradient} text-white shadow-lg`}><Icon className="size-4"/></span><span><strong>{name}</strong><small>{action}</small></span></div>{index < pipeline.length - 1 && <div className="tech-pipeline-line" aria-hidden="true"><i/><i/><i/></div>}</div>)}</div></div></section>
}

export function SectionNav() {
  const [active, setActive] = useState('prisma')
  const items = [['prisma', 'Prisma'], ['evon', 'Evon'], ['timbre', 'Timbre'], ['pipeline', 'Pipeline']]
  useEffect(() => {
    const sections = items.map(([id]) => document.getElementById(id)).filter(Boolean) as HTMLElement[]
    const observer = new IntersectionObserver((entries) => { const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]; if (visible) setActive(visible.target.id) }, { rootMargin: '-18% 0px -65% 0px', threshold: [0, .25, .6] })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [])
  return <nav className="tech-section-nav" aria-label="Technology sections"><div className="tech-section-nav-inner">{items.map(([id, label]) => <a className={active === id ? 'is-active' : ''} href={`#${id}`} key={id}>{label}<span/></a>)}</div></nav>
}

function StatTiles({ model, accent }: { model: AIModel; accent: keyof typeof technologyAccents }) {
  const values = model.highlights.map((item) => {
    const match = item.match(/^(14M\+|Under 200ms|10\+|11|128K|30B|Apache 2\.0|Hinglish|Indian names|Lakh|Context-aware)\s*(.*)$/i)
    return match ? { value: match[1], label: match[2] || item } : { value: item.split(' ').slice(0, 2).join(' '), label: item.split(' ').slice(2).join(' ') || item }
  }).slice(0, 4)
  return <div className="tech-stat-grid">{values.map(({ value, label }) => <div className={`tech-stat-tile ${technologyAccents[accent].soft}`} key={value + label}><Check className={`size-4 ${technologyAccents[accent].text}`}/><strong>{value}</strong><span>{label}</span></div>)}</div>
}

function TiltVisual({ children, accent }: { children: ReactNode; accent: keyof typeof technologyAccents }) {
  const ref = useRef<HTMLDivElement>(null)
  const onMove = (event: React.MouseEvent<HTMLDivElement>) => { if (window.matchMedia('(hover: none), (prefers-reduced-motion: reduce)').matches) return; const rect = event.currentTarget.getBoundingClientRect(); event.currentTarget.style.setProperty('--rx', `${((event.clientY - rect.top) / rect.height - .5) * -3}deg`); event.currentTarget.style.setProperty('--ry', `${((event.clientX - rect.left) / rect.width - .5) * 3}deg`) }
  const onLeave = () => { ref.current?.style.setProperty('--rx', '0deg'); ref.current?.style.setProperty('--ry', '0deg') }
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} className={`tech-visual-shell ${technologyAccents[accent].soft}`}>{children}</div>
}

export function ModelShowcase({ model, accent, side, visual }: { model: AIModel; accent: keyof typeof technologyAccents; side: 'left' | 'right'; visual: 'prisma' | 'evon' | 'timbre' }) {
  const ref = useReveal()
  const config = technologyAccents[accent]
  return <article id={accent} ref={ref} className={`tech-model-panel ${side === 'right' ? 'side-right' : ''} ${config.border}`}><div className="tech-model-copy"><div className="flex items-center gap-3"><span className={`tech-role-pill ${config.soft} ${config.text}`}>{model.role}</span>{model.badge && <span className={`tech-role-pill ${config.soft} ${config.text}`}>{model.badge}</span>}</div><h2 className="mt-5 text-5xl tracking-[-.04em] sm:text-6xl" style={{ fontFamily: 'Georgia, serif' }}>{model.name}</h2>{model.provider && <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">by {model.provider}</p>}<p className="mt-6 max-w-[60ch] text-base leading-8 text-slate-600 dark:text-slate-300">{model.description}</p><StatTiles model={model} accent={accent}/><div className={`tech-role-callout ${config.border}`}><p className={`text-[10px] font-bold uppercase tracking-[.18em] ${config.text}`}>What it does in VeriLex</p><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{model.verilexRole}</p></div>{model.link && <a href={model.link.href} target="_blank" rel="noreferrer" className={`tech-external-link ${config.text}`}>{model.link.label}<ArrowUpRight className="size-4"/></a>}</div><div className="tech-model-visual"><p className="mb-3 text-[10px] font-bold uppercase tracking-[.2em] text-slate-400">Illustrative</p><TiltVisual accent={accent}>{visual === 'prisma' ? <PrismaVisual/> : visual === 'evon' ? <EvonVisual/> : <TimbreVisual/>}</TiltVisual></div></article>
}

export function PrismaVisual() { return <div className="tech-prisma-visual"><div className="tech-waveform" aria-hidden="true">{Array.from({ length: 32 }, (_, index) => <i key={index} style={{ height: `${18 + Math.abs(Math.sin(index * 1.6)) * 48}px`, animationDelay: `${index * 35}ms` }}/>)}</div><div className="tech-latency-sweep" aria-hidden="true"/><p className="tech-transcript">Koi charge nahi lagega, sir.</p><div className="tech-chip-row"><span>Hinglish detected</span><span>Streaming</span></div></div> }

function TraceHeader() { return <><div className="evon-trace-header"><span className="evon-window-dots" aria-hidden="true"><i/><i/><i/></span><strong>Evon v3.3 · Verification</strong><span className="evon-illustrative">Illustrative</span></div><div className="evon-trace-divider"/></> }

function TraceStep({ number, title, children, complete, active }: { number: number; title: string; children: React.ReactNode; complete: boolean; active: boolean }) { return <div className={`evon-trace-step ${complete ? 'is-complete' : ''} ${active ? 'is-active' : ''}`}><div className="evon-trace-marker">{complete ? <CheckCircle2 className="size-3.5"/> : number}</div><div className="evon-trace-step-content"><div className="evon-trace-step-heading"><span>{title}</span>{active && !complete && <i className="evon-thinking" aria-label="Thinking"/>}</div>{children}</div></div> }

function CompareBar() { return <div className="evon-compare"><div><small>Said</small><strong>0%</strong></div><span className="evon-not-equal">≠</span><div><small>Written</small><strong>2%</strong></div><div className="evon-gap-bar" aria-hidden="true"><i/></div></div> }

function VerdictBadge() { return <div className="evon-verdict-wrap"><span className="evon-verdict-badge"><AlertTriangle className="size-3.5"/>Contradiction · High</span><span className="evon-whisper-label">Whisper drafted</span><blockquote>“He said no processing fee. The document says 2 percent.”</blockquote></div> }

export function EvonVisual() {
  const [phase, setPhase] = useState(5)
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => { const node = ref.current; if (!node) return; const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), { threshold: .2 }); observer.observe(node); return () => observer.disconnect() }, [])
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setPhase(5); return }; if (!isVisible) return; setPhase(0); const timer = window.setInterval(() => setPhase((current) => current >= 5 ? 0 : current + 1), 1800); return () => window.clearInterval(timer) }, [isVisible])
  return <div ref={ref} className="tech-evon-visual"><div className="evon-network" aria-hidden="true"><i/><i/><i/><i/><span/><span/><span/></div><div className="evon-trace-card" data-phase={phase}><TraceHeader/><div className="evon-trace-body"><TraceStep number={1} title="Extract claim" complete={phase >= 1} active={phase === 0}><div className="evon-claim-row"><span>“No processing fee”</span><small>Processing fee</small><time>00:14</time></div></TraceStep><TraceStep number={2} title="Find clause" complete={phase >= 2} active={phase === 1}><div className="evon-clause-snippet"><span>Processing fee: <mark>2%</mark> of the loan amount</span><small>Page 2</small></div></TraceStep><TraceStep number={3} title="Compare" complete={phase >= 3} active={phase === 2}><CompareBar/></TraceStep><TraceStep number={4} title="Verdict" complete={phase >= 4} active={phase === 3}><VerdictBadge/></TraceStep></div><p className="evon-trace-footer">Illustrative example. Not real model output.</p></div></div>
}

export function TimbreVisual() { const [playing, setPlaying] = useState(false); return <div className={`tech-timbre-visual ${playing ? 'is-playing' : ''}`}><div className="tech-audio-bar"><button type="button" onClick={() => setPlaying((value) => !value)} aria-label={playing ? 'Pause sample warning' : 'Play sample warning'}><Play className="size-4 fill-current"/></button><div className="tech-audio-wave" aria-hidden="true">{Array.from({ length: 22 }, (_, index) => <i key={index} style={{ height: `${10 + Math.abs(Math.sin(index * 2.1)) * 24}px`, animationDelay: `${index * 40}ms` }}/>)}</div><Volume2 className="size-4 text-amber-600"/></div><p className="tech-whisper-text">He said <mark>no processing fee.</mark> The document says <mark>2 percent.</mark></p><div className="tech-chip-row"><span>₹12,50,000</span><span>Indic numeral handling</span></div></div> }
