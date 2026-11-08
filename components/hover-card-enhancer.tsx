'use client'

import { useEffect } from 'react'

export function HoverCardEnhancer() {
  useEffect(() => {
    const updateSpotlight = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const card = target.closest<HTMLElement>('.hover-card, main article, main a.rounded-2xl, main a.rounded-3xl, main button.rounded-2xl')
      if (!card) return
      const rect = card.getBoundingClientRect()
      card.style.setProperty('--mx', `${event.clientX - rect.left}px`)
      card.style.setProperty('--my', `${event.clientY - rect.top}px`)
    }

    document.addEventListener('pointermove', updateSpotlight, { passive: true })
    return () => document.removeEventListener('pointermove', updateSpotlight)
  }, [])

  return null
}
