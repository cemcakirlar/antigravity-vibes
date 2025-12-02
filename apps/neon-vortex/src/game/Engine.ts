import { Player, Enemy, Bullet, Vector2 } from './Entities'

export enum GameState {
    MENU = 'MENU',
    PLAYING = 'PLAYING',
    PAUSED = 'PAUSED',
    GAMEOVER = 'GAMEOVER'
}

export interface GameOptions {
    wallMode: 'DIE' | 'BOUNCE'
    gameMode: 'NORMAL' | 'INFINITE'
    enemySpeed: 'SLOW' | 'NORMAL' | 'FAST'
}

export class GameEngine {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private isRunning: boolean = false
    private animationId: number = 0

    public state: GameState = GameState.MENU
    public score: number = 0
    public level: number = 1
    public options: GameOptions = { wallMode: 'DIE', gameMode: 'NORMAL', enemySpeed: 'NORMAL' }

    // Metrics
    public deathCount: number = 0
    public startTime: number = 0
    public deathsPerMinute: number = 0

    private player: Player
    private bullets: Bullet[] = []
    private enemies: Enemy[] = []

    private mousePos: Vector2 = new Vector2(0, 0)
    private lastTime: number = 0
    private enemySpawnTimer: number = 0

    private onStateChange: (state: GameState, score: number, level: number, dpm: number) => void

    constructor(
        canvas: HTMLCanvasElement,
        onStateChange: (state: GameState, score: number, level: number, dpm: number) => void
    ) {
        this.canvas = canvas
        this.onStateChange = onStateChange
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get 2D context')
        this.ctx = ctx

        this.resize()
        window.addEventListener('resize', this.resize)
        window.addEventListener('mousemove', this.handleMouseMove)
        window.addEventListener('mousedown', this.handleMouseDown)
        window.addEventListener('keydown', this.handleKeyDown)

        this.player = new Player(canvas.width / 2, canvas.height / 2)
        this.notifyState()
        this.draw() // Initial draw
    }

    private notifyState() {
        this.onStateChange(this.state, this.score, this.level, this.deathsPerMinute)
    }

    private resize = () => {
        this.canvas.width = window.innerWidth
        this.canvas.height = window.innerHeight
        if (this.state !== GameState.PLAYING && this.player) this.draw()
    }

    private handleMouseMove = (e: MouseEvent) => {
        this.mousePos = new Vector2(e.clientX, e.clientY)
    }

    private handleMouseDown = () => {
        if (this.state === GameState.PLAYING) {
            this.shoot()
        }
    }

    private handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            if (this.state === GameState.PLAYING) this.pause()
            else if (this.state === GameState.PAUSED) this.resume()
        }
    }

    setOptions(options: GameOptions) {
        this.options = options
    }

    startGame() {
        this.score = 0
        this.level = 1
        this.deathCount = 0
        this.deathsPerMinute = 0
        this.startTime = Date.now()

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2)
        this.bullets = []
        this.enemies = []
        this.state = GameState.PLAYING
        this.isRunning = true
        this.lastTime = performance.now()
        this.notifyState()
        this.loop(this.lastTime)
    }

    pause() {
        if (this.state !== GameState.PLAYING) return
        this.state = GameState.PAUSED
        this.isRunning = false
        this.notifyState()
        cancelAnimationFrame(this.animationId)
        this.draw() // Draw paused state
    }

    resume() {
        if (this.state !== GameState.PAUSED) return
        this.state = GameState.PLAYING
        this.isRunning = true
        this.lastTime = performance.now()
        this.notifyState()
        this.loop(this.lastTime)
    }

    exitToMenu() {
        this.state = GameState.MENU
        this.isRunning = false
        this.notifyState()
        cancelAnimationFrame(this.animationId)
        this.draw()
    }

    restart() {
        this.startGame()
    }

    private shoot() {
        if (this.player.cooldown > 0) return

        const dir = new Vector2(Math.cos(this.player.rotation), Math.sin(this.player.rotation))
        const bulletVel = dir.mul(10)

        const bulletPos = this.player.pos.add(dir.mul(20))
        this.bullets.push(new Bullet(bulletPos.x, bulletPos.y, bulletVel))

        this.player.vel = this.player.vel.sub(dir.mul(5))
        this.player.cooldown = 10
    }

    destroy() {
        this.stop()
        window.removeEventListener('resize', this.resize)
        window.removeEventListener('mousemove', this.handleMouseMove)
        window.removeEventListener('mousedown', this.handleMouseDown)
        window.removeEventListener('keydown', this.handleKeyDown)
    }

    stop() {
        this.isRunning = false
        cancelAnimationFrame(this.animationId)
    }

    private loop = (timestamp: number) => {
        if (!this.isRunning) return

        const dt = Math.min((timestamp - this.lastTime) / 16.67, 2)
        this.lastTime = timestamp

        this.update(dt)
        this.draw()

        this.animationId = requestAnimationFrame(this.loop)
    }

    private update(dt: number) {
        // Metrics Update
        if (this.options.gameMode === 'INFINITE') {
            const minutesPlayed = (Date.now() - this.startTime) / 60000
            this.deathsPerMinute = minutesPlayed > 0 ? Number((this.deathCount / minutesPlayed).toFixed(1)) : 0
            // Update UI occasionally
            if (Math.random() < 0.05) this.notifyState()
        }

        // Level Logic
        this.level = 1 + Math.floor(this.score / 1000)

        // Player Rotation
        const dx = this.mousePos.x - this.player.pos.x
        const dy = this.mousePos.y - this.player.pos.y
        this.player.rotation = Math.atan2(dy, dx)

        this.player.update(dt)

        // Arena Boundary
        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4
        const dist = this.player.pos.sub(new Vector2(centerX, centerY)).mag()

        if (dist + this.player.radius > radius) {
            if (this.options.wallMode === 'BOUNCE') {
                // Bounce Logic
                const normal = this.player.pos.sub(new Vector2(centerX, centerY)).norm()
                // Reflect velocity: v' = v - 2 * (v . n) * n
                const dot = this.player.vel.x * normal.x + this.player.vel.y * normal.y
                this.player.vel = this.player.vel.sub(normal.mul(2 * dot))
                // Push back slightly to avoid sticking
                this.player.pos = this.player.pos.add(normal.mul(-1))
            } else {
                this.handleDeath()
            }
        }

        // Bullets
        this.bullets.forEach(b => b.update(dt))
        this.bullets = this.bullets.filter(b => {
            const d = b.pos.sub(new Vector2(centerX, centerY)).mag()
            return d < radius
        })

        // Enemies
        this.enemySpawnTimer -= dt
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy(centerX, centerY, radius)
            // Spawn rate increases with level
            const spawnRate = Math.max(20, 60 - (this.level * 5))
            this.enemySpawnTimer = spawnRate
        }

        this.enemies.forEach(e => e.update(dt, this.player.pos))

        // Collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const b = this.bullets[i]
                const e = this.enemies[j]
                if (b.pos.sub(e.pos).mag() < b.radius + e.radius) {
                    this.bullets.splice(i, 1)
                    this.enemies.splice(j, 1)
                    this.score += 100
                    this.notifyState()
                    break
                }
            }
        }

        for (const e of this.enemies) {
            if (e.pos.sub(this.player.pos).mag() < e.radius + this.player.radius) {
                this.handleDeath()
            }
        }
    }

    private handleDeath() {
        if (this.options.gameMode === 'INFINITE') {
            this.deathCount++
            // Respawn logic: Clear enemies around center, reset player
            this.player.pos = new Vector2(this.canvas.width / 2, this.canvas.height / 2)
            this.player.vel = new Vector2(0, 0)
            this.enemies = [] // Clear enemies for fair respawn
            this.notifyState()
        } else {
            this.gameOver()
        }
    }

    private spawnEnemy(cx: number, cy: number, r: number) {
        const angle = Math.random() * Math.PI * 2
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        const enemy = new Enemy(x, y)

        // Apply speed multiplier
        let speedMultiplier = 1.0
        if (this.options.enemySpeed === 'SLOW') speedMultiplier = 0.5
        if (this.options.enemySpeed === 'FAST') speedMultiplier = 1.5

        // Hacky way to set initial velocity for now since Enemy class handles it in update
        // Ideally we should pass speed to Enemy constructor
        // For now, let's just let them be spawned. The Enemy.update logic uses a fixed acceleration.
        // We need to modify Enemy.update to use this multiplier.
        // Wait, Enemy.update uses hardcoded values. I should modify Enemy class or pass a multiplier.
        // Let's modify Enemy class to accept a speed multiplier.
        enemy.speedMultiplier = speedMultiplier

        this.enemies.push(enemy)
    }

    private gameOver() {
        this.state = GameState.GAMEOVER
        this.isRunning = false
        this.notifyState()
        this.draw()
    }

    private draw() {
        this.ctx.fillStyle = '#050505'
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

        const centerX = this.canvas.width / 2
        const centerY = this.canvas.height / 2
        const radius = Math.min(this.canvas.width, this.canvas.height) * 0.4

        // Arena
        this.ctx.beginPath()
        this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
        this.ctx.strokeStyle = '#0ff'
        this.ctx.lineWidth = 4
        this.ctx.shadowBlur = 20
        this.ctx.shadowColor = '#0ff'
        this.ctx.stroke()
        this.ctx.shadowBlur = 0

        this.player.draw(this.ctx)
        this.bullets.forEach(b => b.draw(this.ctx))
        this.enemies.forEach(e => e.draw(this.ctx))
    }
}
