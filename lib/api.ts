import type { Clause, Finding, Session } from '@/types'

export const sampleClauses: Clause[] = [
  { id: '1', category: 'Interest rate', text: 'The applicable interest rate shall be 11.5% per annum, reducing balance method.', value: '11.5% p.a.', page: 1 },
  { id: '2', category: 'Processing fee', text: 'A processing fee of 2% of the sanctioned loan amount plus applicable taxes is payable.', value: '2% + GST', page: 2 },
  { id: '3', category: 'Prepayment penalty', text: 'Foreclosure charges of 5% shall apply during the first 12 months.', value: '5% for 12 months', page: 4 },
  { id: '4', category: 'Lock-in', text: 'The borrower may not close the loan before 12 EMIs have been paid.', value: '12 EMIs', page: 4 },
  { id: '5', category: 'Insurance', text: 'Comprehensive insurance is required and may be arranged by the borrower.', value: 'Required', page: 5 },
]
export async function uploadDocument(file?: File) { return { id: 'doc_001', name: file?.name ?? 'Two-wheeler loan offer.pdf' } }
export async function getClauses() { return sampleClauses }
export async function startSession(input: Pick<Session, 'documentName' | 'language'>): Promise<Session> { return { id: 'ses_001', ...input, status: 'live', createdAt: new Date().toISOString() } }
export async function endSession(id: string) { return { id, status: 'ended' as const } }
export async function getReport(_id: string): Promise<Finding[]> { return [{ id: 'f1', verdict: 'contradiction', severity: 'high', spoken: 'No processing fee, sir.', written: '2% of sanctioned amount + GST', page: 2, timestamp: '00:14' }] }
export async function askQuestion(question: string) { return { answer: `Based on your document, I found one relevant clause for “${question}”.` } }
