class PcmProcessor extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(512); this.offset = 0 }
  process(inputs) {
    const channel = inputs[0]?.[0]
    if (!channel) return true
    for (let i = 0; i < channel.length; i++) {
      this.buffer[this.offset++] = channel[i]
      if (this.offset === 512) {
        const pcm = new Int16Array(512)
        for (let j = 0; j < 512; j++) { const sample = Math.max(-1, Math.min(1, this.buffer[j])); pcm[j] = sample < 0 ? sample * 32768 : sample * 32767 }
        this.port.postMessage(pcm.buffer, [pcm.buffer]); this.offset = 0
      }
    }
    return true
  }
}
registerProcessor('pcm', PcmProcessor)
