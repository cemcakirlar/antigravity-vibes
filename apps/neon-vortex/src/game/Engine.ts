import { Player, Enemy, Bullet, Vector2, Particle, PowerUp, PowerUpType, EnemyType } from './Entities'
import { AudioController } from './Audio'
import { GameState, GameOptions, CheatConfig } from './types'

export class GameEngine {
    private canvas: HTMLCanvasElement
    private ctx: CanvasRenderingContext2D
    private isRunning: boolean = false
    private animationId: number = 0

    public state: GameState = GameState.MENU
    public score: number = 0
    public level: number = 1
    public options: GameOptions = {
        wallMode: 'DIE',
        gameMode: 'NORMAL',
        enemySpeed: 'NORMAL',
        movementMode: 'RECOIL',
        soundEnabled: true,
        autoFire: false,
        difficulty: 'NORMAL',
        survivalThreshold: 30
    }

    public cheats: CheatConfig = {
        enemySpawnRate: 60,
        powerUpChance: 0.3,
        enemySpeedMultiplier: 1.0,
        godMode: false,
        survivalThresholdOverride: null
    }

    // Metrics
    public deathCount: number = 0
    public startTime: number = 0
    public deathsPerMinute: number = 0
    public totalEnemiesSpawned: number = 0

    private player: Player
    private bullets: Bullet[] = []
    private enemyBullets: Bullet[] = []
    private enemies: Enemy[] = []
    private particles: Particle[] = []
    private powerups: PowerUp[] = []

    private mousePos: Vector2 = new Vector2(0, 0)
    private keysPressed: Set<string> = new Set()
    private lastTime: number = 0
    private enemySpawnTimer: number = 0

    // Juice
    private audio: AudioController
    private shakeTimer: number = 0
    private shakeIntensity: number = 0

    private onStateChange: (state: GameState, score: number, level: number, dpm: number, activePowerUps: PowerUpType[], totalEnemiesSpawned: number) => void

    constructor(
        canvas: HTMLCanvasElement,
        onStateChange: (state: GameState, score: number, level: number, dpm: number, activePowerUps: PowerUpType[], totalEnemiesSpawned: number) => void
    ) {
        this.canvas = canvas
        this.onStateChange = onStateChange
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Could not get 2D context')
        this.ctx = ctx

        this.audio = new AudioController()

        this.resize()
        window.addEventListener('resize', this.resize)
        window.addEventListener('mousemove', this.handleMouseMove)
        window.addEventListener('mousedown', this.handleMouseDown)
        window.addEventListener('keydown', this.handleKeyDown)
        window.addEventListener('keyup', this.handleKeyUp)

        this.player = new Player(canvas.width / 2, canvas.height / 2)
        this.notifyState()
        this.draw() // Initial draw
    }

    private notifyState() {
        if (this.onStateChange) {
            const activePowerUps = Array.from(this.player.powerups.keys())
            this.onStateChange(this.state, this.score, this.level, this.deathsPerMinute, activePowerUps, this.totalEnemiesSpawned)
        }
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
        this.keysPressed.add(e.key.toLowerCase())

        if (e.key === 'Escape') {
            if (this.state === GameState.PLAYING) this.pause()
            else if (this.state === GameState.PAUSED) this.resume()
        }
    }

    private handleKeyUp = (e: KeyboardEvent) => {
        this.keysPressed.delete(e.key.toLowerCase())
    }

    setOptions(options: GameOptions) {
        this.options = options
    }

    setCheats(cheats: CheatConfig) {
        this.cheats = cheats
    }

    startGame() {
        this.score = 0
        this.level = 1
        this.deathCount = 0
        this.deathCount = 0
        this.deathsPerMinute = 0
        this.totalEnemiesSpawned = 0
        this.startTime = Date.now()

        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2)
        this.bullets = []
        this.enemyBullets = []
        this.enemies = []
        this.particles = []
        this.powerups = []
        this.keysPressed.clear()
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

        // Spread Shot Logic
        const shotCount = this.player.hasPowerUp('SPREAD') ? 3 : 1
        const spreadAngle = 0.2

        for (let i = 0; i < shotCount; i++) {
            let angle = this.player.rotation
            if (shotCount > 1) {
                angle += (i - 1) * spreadAngle
            }
            const shotDir = new Vector2(Math.cos(angle), Math.sin(angle))
            const bulletVel = shotDir.mul(10)
            const bulletPos = this.player.pos.add(shotDir.mul(20))
            this.bullets.push(new Bullet(bulletPos.x, bulletPos.y, bulletVel))
        }

        if (this.options.soundEnabled) this.audio.playShoot()

        // Only apply recoil if NOT in WASD mode
        if (this.options.movementMode !== 'WASD') {
            this.player.vel = this.player.vel.sub(dir.mul(5))
        }

        // Rapid Fire Logic
        this.player.cooldown = this.player.hasPowerUp('RAPID_FIRE') ? 5 : 10
    }

    destroy() {
        this.stop()
        window.removeEventListener('resize', this.resize)
        window.removeEventListener('mousemove', this.handleMouseMove)
        window.removeEventListener('mousedown', this.handleMouseDown)
        window.removeEventListener('keydown', this.handleKeyDown)
        window.removeEventListener('keyup', this.handleKeyUp)
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
        // Auto Fire Logic
        if (this.options.autoFire) {
            this.shoot()
        }

        // Metrics Update
        if (this.options.gameMode === 'INFINITE' || this.options.gameMode === 'SURVIVAL') {
            const minutesPlayed = (Date.now() - this.startTime) / 60000
            this.deathsPerMinute = minutesPlayed > 0 ? Number((this.deathCount / minutesPlayed).toFixed(1)) : 0

            // Survival Mode Logic
            if (this.options.gameMode === 'SURVIVAL') {
                const threshold = this.cheats.survivalThresholdOverride ?? this.options.survivalThreshold
                // Grace period: Wait until (120 / threshold) enemies have spawned
                // e.g. Threshold 30 -> Wait for 4 enemies
                const minEnemies = Math.ceil(120 / (threshold || 1)) // Avoid div by 0

                if (this.totalEnemiesSpawned >= minEnemies) {
                    if (this.deathsPerMinute > threshold) {
                        this.gameOver()
                    }
                }
            }

            // Update UI occasionally
            if (Math.random() < 0.05) this.notifyState()
        }

        // Shake Timer
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt
            if (this.shakeTimer <= 0) this.shakeIntensity = 0
        }

        // Level Logic
        this.level = 1 + Math.floor(this.score / 1000)

        // Player Rotation
        const dx = this.mousePos.x - this.player.pos.x
        const dy = this.mousePos.y - this.player.pos.y
        this.player.rotation = Math.atan2(dy, dx)

        // WASD Movement Logic
        if (this.options.movementMode === 'WASD') {
            const acceleration = 0.5
            if (this.keysPressed.has('w')) this.player.vel.y -= acceleration
            if (this.keysPressed.has('s')) this.player.vel.y += acceleration
            if (this.keysPressed.has('a')) this.player.vel.x -= acceleration
            if (this.keysPressed.has('d')) this.player.vel.x += acceleration

            // Spacebar Shooting
            if (this.keysPressed.has(' ')) {
                this.shoot()
            }

            // Stronger friction for WASD for tighter control
            this.player.vel = this.player.vel.mul(0.92)
        } else {
            // Normal friction for Recoil mode
            this.player.vel = this.player.vel.mul(0.98)
        }

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

                if (this.options.soundEnabled) this.audio.playHit()
                this.triggerShake(5, 5)
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

        // Enemy Bullets
        this.enemyBullets.forEach(b => b.update(dt))
        this.enemyBullets = this.enemyBullets.filter(b => {
            const d = b.pos.sub(new Vector2(centerX, centerY)).mag()
            return d < radius
        })

        // Enemies
        // Enemies
        this.enemySpawnTimer -= dt
        if (this.enemySpawnTimer <= 0) {
            this.spawnEnemy(centerX, centerY, radius)

            // Use cheat spawn rate as base, scale with level
            const spawnRate = Math.max(10, this.cheats.enemySpawnRate - (this.level * 2))
            this.enemySpawnTimer = spawnRate
        }

        this.enemies.forEach(e => {
            e.update(dt, this.player.pos)

            // Enemy Shooting
            if (e.type === 'SHOOTER' && e.shootTimer <= 0) {
                const dir = this.player.pos.sub(e.pos).norm()
                const bulletVel = dir.mul(6)
                this.enemyBullets.push(new Bullet(e.pos.x, e.pos.y, bulletVel, true))
                e.shootTimer = 120 // 2 seconds at 60fps
                if (this.options.soundEnabled) this.audio.playShoot()
            }
        })

        // Particles
        this.particles.forEach(p => p.update(dt))
        this.particles = this.particles.filter(p => p.life > 0)

        // Powerups
        this.powerups.forEach(p => p.update(dt))
        this.powerups = this.powerups.filter(p => p.life > 0)

        // Powerup Collision (Player)
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i]
            if (p.pos.sub(this.player.pos).mag() < p.radius + this.player.radius) {
                this.collectPowerUp(p)
                this.powerups.splice(i, 1)
            }
        }

        // Powerup Collision (Bullets)
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]
            for (let j = this.powerups.length - 1; j >= 0; j--) {
                const p = this.powerups[j]
                // Increase collision radius for easier collection
                if (b.pos.sub(p.pos).mag() < b.radius + p.radius + 10) {
                    this.collectPowerUp(p)
                    this.powerups.splice(j, 1)
                    this.bullets.splice(i, 1)
                    break
                }
            }
        }

        // Collisions
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const b = this.bullets[i]
                const e = this.enemies[j]
                if (b.pos.sub(e.pos).mag() < b.radius + e.radius) {
                    this.bullets.splice(i, 1)

                    e.hp--
                    if (e.hp <= 0) {
                        this.enemies.splice(j, 1)
                        this.score += e.type === 'TANK' ? 300 : 100

                        if (this.options.soundEnabled) this.audio.playExplosion()
                        this.spawnParticles(e.pos.x, e.pos.y, e.color, 10)
                        this.triggerShake(5, 5)

                        // Chance to spawn powerup
                        if (Math.random() < this.cheats.powerUpChance) {
                            this.spawnPowerUp(e.pos.x, e.pos.y)
                        }
                    } else {
                        // Hit effect for tank
                        this.spawnParticles(e.pos.x, e.pos.y, e.color, 3)
                        if (this.options.soundEnabled) this.audio.playHit()
                    }

                    this.notifyState()
                    break
                }
            }
        }

        // Player vs Enemy
        for (const e of this.enemies) {
            if (e.pos.sub(this.player.pos).mag() < e.radius + this.player.radius) {
                this.handleDeath()
            }
        }

        // Player vs Enemy Bullet
        for (const b of this.enemyBullets) {
            if (b.pos.sub(this.player.pos).mag() < b.radius + this.player.radius) {
                this.handleDeath()
            }
        }
    }

    private handleDeath() {
        if (this.cheats.godMode) return

        if (this.player.hasPowerUp('SHIELD')) {
            this.player.powerups.delete('SHIELD')
            this.enemies = [] // Clear enemies to give breathing room
            this.enemyBullets = []
            this.triggerShake(10, 10)
            if (this.options.soundEnabled) this.audio.playExplosion()
            return
        }

        if (this.options.soundEnabled) this.audio.playExplosion()
        this.triggerShake(20, 10)

        if (this.options.gameMode === 'INFINITE' || this.options.gameMode === 'SURVIVAL') {
            this.deathCount++
            // Respawn logic: Clear enemies around center, reset player
            this.player.pos = new Vector2(this.canvas.width / 2, this.canvas.height / 2)
            this.player.vel = new Vector2(0, 0)
            this.enemies = [] // Clear enemies for fair respawn
            this.enemyBullets = []
            // Don't clear powerups so player can collect existing ones
            this.notifyState()
        } else {
            this.gameOver()
        }
    }

    private collectPowerUp(p: PowerUp) {
        let duration = 600 // 10s default
        if (this.options.difficulty === 'EASY') duration = 900 // 15s
        if (this.options.difficulty === 'HARD') duration = 300 // 5s

        this.player.addPowerUp(p.type, duration)
        if (this.options.soundEnabled) this.audio.playHit()
        this.spawnParticles(p.pos.x, p.pos.y, p.color, 10) // Visual feedback
        this.notifyState()
    }

    private spawnEnemy(cx: number, cy: number, r: number) {
        const angle = Math.random() * Math.PI * 2
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r

        // Determine type based on level
        let type: EnemyType = 'NORMAL'
        const rand = Math.random()

        if (this.level >= 2 && rand < 0.3) type = 'DASHER'
        if (this.level >= 3 && rand < 0.2) type = 'SHOOTER'
        if (this.level >= 5 && rand < 0.1) type = 'TANK'

        const enemy = new Enemy(x, y, type)

        // Apply speed multiplier
        let baseMultiplier = 1.0
        if (this.options.enemySpeed === 'SLOW') baseMultiplier = 0.5
        if (this.options.enemySpeed === 'FAST') baseMultiplier = 1.5

        enemy.speedMultiplier = baseMultiplier * this.cheats.enemySpeedMultiplier

        this.enemies.push(enemy)
        this.totalEnemiesSpawned++
    }

    private spawnPowerUp(x: number, y: number) {
        const types: PowerUpType[] = ['RAPID_FIRE', 'SPREAD', 'SHIELD']
        const type = types[Math.floor(Math.random() * types.length)]
        this.powerups.push(new PowerUp(x, y, type))
    }

    private spawnParticles(x: number, y: number, color: string, count: number) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 5 + 2, 30))
        }
    }

    private triggerShake(intensity: number, duration: number) {
        this.shakeIntensity = intensity
        this.shakeTimer = duration
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

        this.ctx.save()
        if (this.shakeTimer > 0) {
            const dx = (Math.random() - 0.5) * this.shakeIntensity
            const dy = (Math.random() - 0.5) * this.shakeIntensity
            this.ctx.translate(dx, dy)
        }

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

        this.powerups.forEach(p => p.draw(this.ctx))
        this.particles.forEach(p => p.draw(this.ctx))
        this.player.draw(this.ctx)
        this.bullets.forEach(b => b.draw(this.ctx))
        this.enemyBullets.forEach(b => b.draw(this.ctx))
        this.enemies.forEach(e => e.draw(this.ctx))

        this.ctx.restore()
    }
}
