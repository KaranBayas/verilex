import type { Commitment, Finding, Utterance } from '@/types'

type Handler<T> = (value: T) => void
type Status = 'connecting' | 'live' | 'error'
export interface WarningEvent { type?: 'warning'; text: string; audio_b64?: string | null; finding_id?: string; category?: string; tts_error?: string | null }
type Events = { transcript: Utterance; commitment: Commitment; finding: Finding; warning: string; audioLevel: number; status: Status; error: string; toast: string }
export interface LiveSocket {
  onTranscript: (handler: Handler<Utterance>) => () => void
  onCommitment: (handler: Handler<Commitment>) => () => void
  onFinding: (handler: Handler<Finding>) => () => void
  onWarning: (handler: Handler<string>) => () => void
  onAudioLevel: (handler: Handler<number>) => () => void
  onStatus: (handler: Handler<Status>) => () => void
  onError: (handler: Handler<string>) => () => void
  onToast: (handler: Handler<string>) => () => void
  sendControl: (message: Record<string, unknown>) => void
  handleWarning: (warning: WarningEvent) => Promise<void>
  replayWarning: () => Promise<void>
  close: () => void
}

let reusableAudio: HTMLAudioElement | null = null
function getWarningAudio() {
  if (typeof Audio === 'undefined') return null
  if (!reusableAudio) { reusableAudio = new Audio(); reusableAudio.preload = 'auto' }
  return reusableAudio
}

function silentWavUrl() {
  const samples = 1600
  const buffer = new ArrayBuffer(44 + samples * 2)
  const view = new DataView(buffer)
  const ascii = (offset: number, value: string) => [...value].forEach((c, i) => view.setUint8(offset + i, c.charCodeAt(0)))
  ascii(0, 'RIFF'); view.setUint32(4, 36 + samples * 2, true); ascii(8, 'WAVE'); ascii(12, 'fmt ')
  view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
  view.setUint32(24, 16000, true); view.setUint32(28, 32000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
  ascii(36, 'data'); view.setUint32(40, samples * 2, true)
  let binary = ''; for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte)
  return `data:audio/wav;base64,${btoa(binary)}`
}

export function unlockWarningAudio() {
  const audio = getWarningAudio()
  if (!audio) return
  audio.src = silentWavUrl()
  audio.volume = 0.001
  const playing = audio.play()
  void playing.then(() => { audio.pause(); audio.currentTime = 0; audio.removeAttribute('src'); audio.load() }).catch(() => {})
}

export function createLiveSocket(options: { language?: string; document?: Record<string, number> } = {}): LiveSocket {
  const language = options.language ?? 'en-IN'
  const handlers: { [K in keyof Events]: Set<Handler<Events[K]>> } = { transcript: new Set(), commitment: new Set(), finding: new Set(), warning: new Set(), audioLevel: new Set(), status: new Set(), error: new Set(), toast: new Set() }
  let currentStatus: Status = 'connecting', currentError = ''
  const subscribe = <K extends keyof Events>(key: K, handler: Handler<Events[K]>) => {
    handlers[key].add(handler)
    if (key === 'status') (handler as Handler<Status>)(currentStatus)
    if (key === 'error' && currentError) (handler as Handler<string>)(currentError)
    return () => handlers[key].delete(handler)
  }
  let socket: WebSocket | undefined, stream: MediaStream | undefined, context: AudioContext | undefined, node: AudioWorkletNode | undefined, source: MediaStreamAudioSourceNode | undefined, closed = false
  let currentWarning: WarningEvent | null = null, audioPlaying = false, suppressMicUntil = 0
  let warningQueue: Promise<void> = Promise.resolve()
  const toast = (message: string) => handlers.toast.forEach(h => h(message))
  const status = (value: Status) => { currentStatus = value; handlers.status.forEach(h => h(value)) }
  const fail = (message: string) => { currentError = message; status('error'); handlers.error.forEach(h => h(message)); toast(message) }
  const speakFallback = (text: string) => new Promise<void>((resolve, reject) => {
    if (!('speechSynthesis' in window)) { reject(new Error('Speech synthesis is unavailable')); return }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = language; utterance.volume = 0.6
    utterance.onend = () => resolve()
    utterance.onerror = () => reject(new Error('Backup voice playback failed'))
    window.speechSynthesis.speak(utterance)
  })
  const playNow = async (warning: WarningEvent) => {
    currentWarning = warning
    handlers.warning.forEach(h => h(warning.text))
    audioPlaying = true
    try {
      const audio = getWarningAudio()
      if (!warning.audio_b64 || !audio) throw new Error(warning.tts_error || 'Warning audio was not available')
      audio.pause(); audio.currentTime = 0; audio.src = `data:audio/wav;base64,${warning.audio_b64}`; audio.volume = 0.5
      await new Promise<void>((resolve, reject) => {
        const ended = () => { cleanup(); resolve() }
        const failed = () => { cleanup(); reject(new Error('Audio blocked by the browser: click anywhere and try again')) }
        const cleanup = () => { audio.removeEventListener('ended', ended); audio.removeEventListener('error', failed) }
        audio.addEventListener('ended', ended, { once: true }); audio.addEventListener('error', failed, { once: true })
        void audio.play().catch(error => { cleanup(); reject(error) })
      })
    } catch (error) {
      if (!warning.audio_b64 || !getWarningAudio()) toast('Using backup voice')
      else { toast(error instanceof Error ? error.message : 'Warning audio playback failed'); toast('Using backup voice') }
      try { await speakFallback(warning.text) }
      catch { toast('Audio blocked by the browser: click anywhere and try again') }
    } finally {
      audioPlaying = false
      suppressMicUntil = Date.now() + 1000
    }
  }
  const handleWarning = (warning: WarningEvent) => {
    warningQueue = warningQueue.then(() => playNow(warning), () => playNow(warning))
    return warningQueue
  }
  const replayWarning = () => currentWarning ? handleWarning(currentWarning) : Promise.resolve()
  const close = () => {
    if (closed) return
    closed = true
    try { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'stop' })) } catch {}
    node?.disconnect(); source?.disconnect(); stream?.getTracks().forEach(track => track.stop()); void context?.close()
    if (socket && socket.readyState < WebSocket.CLOSING) socket.close()
  }
  const wsUrl = process.env.NEXT_PUBLIC_BACKEND_WS_URL
  if (!wsUrl) { fail('Backend URL is not configured. Set NEXT_PUBLIC_BACKEND_WS_URL.'); return { onTranscript: h => subscribe('transcript', h), onCommitment: h => subscribe('commitment', h), onFinding: h => subscribe('finding', h), onWarning: h => subscribe('warning', h), onAudioLevel: h => subscribe('audioLevel', h), onStatus: h => subscribe('status', h), onError: h => subscribe('error', h), onToast: h => subscribe('toast', h), sendControl: () => {}, handleWarning, replayWarning, close } }

  status('connecting')
  try { socket = new WebSocket(wsUrl) } catch { fail('Could not reach the live backend.'); }
  if (socket) {
    socket.onopen = () => { socket?.send(JSON.stringify({ type: 'start', language, document: options.document ?? { processing_fee: 2, prepayment_penalty: 5, interest_rate: 11.5 } })); status('live') }
    socket.onerror = () => fail('Could not reach the live backend. Check that it is running and the URL is correct.')
    socket.onclose = () => { if (!closed && currentStatus !== 'error') fail('The live backend connection closed.') }
    socket.onmessage = event => {
      try {
        const m = JSON.parse(String(event.data))
        if (m.type === 'error') { const message = m.message || 'The live backend reported an error.'; handlers.error.forEach(h => h(message)); toast(message); return }
        if (m.type === 'transcript') handlers.transcript.forEach(h => h({ id: `live-${Date.now()}`, speaker: 'Agent', text: m.text, timestamp: new Date(m.ts || Date.now()).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }), language }))
        if (m.type === 'finding') handlers.finding.forEach(h => h({ id: m.finding_id || `live-${Date.now()}`, verdict: m.verdict, severity: m.severity, spoken: m.claim || m.whisper_text, written: m.explanation, timestamp: new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }) }))
        if (m.type === 'warning') void handleWarning(m as WarningEvent)
      } catch { fail('Received an invalid message from the live backend.') }
    }
  }
  void (async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } })
      if (closed) { stream.getTracks().forEach(t => t.stop()); return }
      context = new AudioContext({ sampleRate: 16000 })
      await context.audioWorklet.addModule('/pcm-worklet.js')
      if (closed) return
      node = new AudioWorkletNode(context, 'pcm'); source = context.createMediaStreamSource(stream); source.connect(node); node.connect(context.destination)
      node.port.onmessage = e => { if (!audioPlaying && Date.now() >= suppressMicUntil && socket?.readyState === WebSocket.OPEN) socket.send(e.data) }
    } catch (error) { fail(error instanceof DOMException && error.name === 'NotAllowedError' ? 'Microphone access was denied. Allow microphone access and retry.' : 'Could not start microphone audio. Check browser microphone support and permissions.') }
  })()
  return { onTranscript: h => subscribe('transcript', h), onCommitment: h => subscribe('commitment', h), onFinding: h => subscribe('finding', h), onWarning: h => subscribe('warning', h), onAudioLevel: h => subscribe('audioLevel', h), onStatus: h => subscribe('status', h), onError: h => subscribe('error', h), onToast: h => subscribe('toast', h), sendControl: message => { if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify(message)) }, handleWarning, replayWarning, close }
}
