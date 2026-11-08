export type Verdict = 'match' | 'contradiction' | 'not_mentioned' | 'unclear'
export type Severity = 'high' | 'medium' | 'low'
export type ClauseCategory = 'Interest rate' | 'Processing fee' | 'Prepayment penalty' | 'Lock-in' | 'Insurance' | 'Other'

export interface Clause { id: string; category: ClauseCategory; text: string; value: string; page: number }
export interface Utterance { id: string; speaker: 'Agent' | 'You'; text: string; language: string; timestamp: string; partial?: boolean }
export interface Commitment { id: string; text: string; value?: string; timestamp: string }
export interface Finding { id: string; verdict: Verdict; severity: Severity; spoken: string; written: string; page?: number; timestamp: string }
export interface Session { id: string; documentName: string; language: string; status: 'draft' | 'live' | 'ended'; createdAt: string }
