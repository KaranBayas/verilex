'use client'

import Link from 'next/link'
import { aiModels } from '@/lib/models'
import { Footer, Navbar } from '@/components/shared'
import { LanguageMarquee, ModelShowcase, SectionNav, StatsBand, TechCta, TechHero, TechNotes, WarningTimeline, WhyBento } from '@/components/technology'

export default function TechnologyPage() {
  const prisma = aiModels.find((model) => model.name === 'Prisma v2.5')!
  const evon = aiModels.find((model) => model.name === 'Evon v3.3')!
  const timbre = aiModels.find((model) => model.name === 'Timbre v2.5')!

  return <div className="min-h-screen text-[#0b1b34] dark:text-white"><Navbar/><main><TechHero/><SectionNav/><section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8"><ModelShowcase model={prisma} accent="prisma" side="left" visual="prisma"/><ModelShowcase model={evon} accent="evon" side="right" visual="evon"/><ModelShowcase model={timbre} accent="timbre" side="left" visual="timbre"/>
    <StatsBand/><WhyBento/><WarningTimeline/><LanguageMarquee/><TechNotes/><TechCta/>
  </section></main><Footer/></div>
}
