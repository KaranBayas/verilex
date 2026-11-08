import type { Commitment, Finding, Utterance } from '@/types'

type Handler<T> = (value: T) => void
export interface LiveSocket { onTranscript: (handler: Handler<Utterance>) => () => void; onCommitment: (handler: Handler<Commitment>) => () => void; onFinding: (handler: Handler<Finding>) => () => void; onWarning: (handler: Handler<string>) => () => void; onAudioLevel: (handler: Handler<number>) => () => void }
export function createLiveSocket(): LiveSocket {
  // Replace this mock with a WebSocket connection to the FastAPI streaming backend.
  const empty = <T,>(_handler: Handler<T>) => () => undefined
  return { onTranscript: empty, onCommitment: empty, onFinding: empty, onWarning: empty, onAudioLevel: empty }
}
