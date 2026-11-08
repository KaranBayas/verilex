'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { aiModels } from '@/lib/models'
import { Footer, Navbar } from '@/components/shared'
import { WarningTimeline } from '@/components/models'
import { ModelShowcase, SectionNav, TechHero } from '@/components/technology'

export default function TechnologyPage() {
  const prisma = aiModels.find((model) => model.name === 'Prisma v2.5')!
  const evon = aiModels.find((model) => model.name === 'Evon v3.3')!
  const timbre = aiModels.find((model) => model.name === 'Timbre v2.5')!

  return <div className="min-h-screen text-[#0b1b34] dark:text-white"><Navbar/><main><TechHero/><SectionNav/><section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8"><ModelShowcase model={prisma} accent="prisma" side="left" visual="prisma"/><ModelShowcase model={evon} accent="evon" side="right" visual="evon"/><ModelShowcase model={timbre} accent="timbre" side="left" visual="timbre"/>
    <div className="mt-16 grid gap-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[1fr_1.4fr] lg:p-10"><div><p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">Coverage</p><h2 className="mt-3 text-3xl font-semibold">Language coverage</h2><p className="mt-4 text-sm leading-6 text-slate-500">Indian-language intelligence tuned for code-mixed conversations.</p></div><div className="flex flex-wrap content-start gap-3">{['Hindi','Marathi','English','Hinglish','Tanglish','Benglish','+ more'].map(language => <span key={language} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700">{language}</span>)}</div></div>
    <section className="py-24"><div className="text-center"><p className="text-xs font-bold uppercase tracking-widest text-teal-700 dark:text-teal-300">The loop</p><h2 className="mt-3 text-3xl font-semibold">How a warning is made</h2></div><div className="mt-12"><WarningTimeline/></div></section>
    <div className="grid gap-6 lg:grid-cols-2"><div className="rounded-3xl bg-[#0b1b34] p-8 text-white"><Sparkles className="size-6 text-teal-300"/><h2 className="mt-5 text-2xl font-semibold">Open and transparent</h2><p className="mt-4 text-sm leading-7 text-slate-300">Evon v3.3 is available with Apache 2.0 weights by request on Hugging Face, so its reasoning foundation can be inspected and built upon.</p></div><div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100"><p className="text-sm leading-7">Model figures are as published by their providers and may change. Timbre v2.5 is currently in beta.</p></div></div>
    <div className="mt-16 rounded-3xl bg-teal-600 p-8 text-white shadow-xl shadow-teal-900/20 sm:flex sm:items-center sm:justify-between"><div><h2 className="text-3xl font-semibold">Try VeriLex</h2><p className="mt-2 text-teal-50">Bring a second set of ears to your next conversation.</p></div><Link href="/session/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-teal-800 sm:mt-0">Start a session <ArrowRight className="size-4" /></Link></div>
  </section></main><Footer/></div>
}
