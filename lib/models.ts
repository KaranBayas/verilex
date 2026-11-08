export type ModelRole = 'Speech to Text' | 'Text to Speech' | 'Reasoning'

export interface AIModel {
  role: ModelRole
  name: string
  provider: string
  description: string
  link?: { href: string; label: string }
  verilexRole: string
  highlights: string[]
  badge?: 'Beta' | 'Open weight'
}

export const aiModels: AIModel[] = [
  {
    role: 'Speech to Text', name: 'Prisma v2.5', provider: 'Gnani AI',
    description: "Trained on 14M+ hours of telephonic audio. Streams in under 200ms across 10+ Indian languages plus Hinglish, Tanglish and Benglish, according to Gnani AI's published benchmarks.",
    link: { href: 'https://www.gnani.ai/speech-to-text-api', label: 'Speech to text API' },
    verilexRole: "Hears the agent's live speech, including code-mixed Hindi, Marathi and English, and streams it to the verifier.",
    highlights: ['14M+ hours of telephonic audio', 'Under 200ms streaming', '10+ Indian languages', 'Hinglish, Tanglish and Benglish'],
  },
  {
    role: 'Text to Speech', name: 'Timbre v2.5', provider: 'Gnani AI',
    description: 'Speaks 10+ Indic languages with context-aware prosody, Indian names, numerals and lakh and crore cadence. Streams over WebSocket and SSE.',
    link: { href: 'https://www.gnani.ai/text-to-speech-api', label: 'Text to speech API' },
    verilexRole: 'Whispers short, natural warnings to the user, reading amounts like lakh and crore correctly.',
    highlights: ['10+ Indic languages', 'Context-aware prosody', 'Indian names and numerals', 'Lakh and crore cadence', 'WebSocket and SSE streaming'],
    badge: 'Beta',
  },
  {
    role: 'Reasoning', name: 'Evon v3.3', provider: '',
    description: 'A 30B-parameter mixture-of-experts model with 128K context and 11 Indian languages natively. Apache 2.0 weights are available by request on Hugging Face.',
    verilexRole: 'Extracts spoken promises, reads the document clauses, decides whether a claim contradicts the paper, and writes the warning.',
    highlights: ['30B parameter mixture of experts', '128K context window', '11 Indian languages natively', 'Apache 2.0 weights by request'],
    badge: 'Open weight',
  },
]
