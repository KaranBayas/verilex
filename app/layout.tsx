import type { Metadata, Viewport } from 'next'
import './globals.css'
import { PaperBackground } from '@/components/paper-background'
export const metadata: Metadata = { title: 'VeriLex — The witness in your ear', description: 'Real-time voice AI that checks spoken promises against the paper.', generator: 'v0.app' }
export const viewport: Viewport = { colorScheme: 'light dark', themeColor: '#0b1b34' }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body className="antialiased"><PaperBackground />{children}</body></html> }
