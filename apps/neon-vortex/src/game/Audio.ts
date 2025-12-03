export class AudioController {
    private ctx: AudioContext
    private masterGain: GainNode

    constructor() {
        this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        this.masterGain = this.ctx.createGain()
        this.masterGain.gain.value = 0.3 // Master volume
        this.masterGain.connect(this.ctx.destination)
    }

    playShoot() {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.type = 'square'
        osc.frequency.setValueAtTime(880, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(110, this.ctx.currentTime + 0.1)

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.1)
    }

    playExplosion() {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.type = 'sawtooth'
        osc.frequency.setValueAtTime(100, this.ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.3)
    }

    playHit() {
        const osc = this.ctx.createOscillator()
        const gain = this.ctx.createGain()

        osc.connect(gain)
        gain.connect(this.masterGain)

        osc.type = 'triangle'
        osc.frequency.setValueAtTime(200, this.ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.1)

        gain.gain.setValueAtTime(0.5, this.ctx.currentTime)
        gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.1)

        osc.start()
        osc.stop(this.ctx.currentTime + 0.1)
    }
}
