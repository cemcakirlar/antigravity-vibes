export class Vector2 {
    constructor(public x: number, public y: number) { }

    add(v: Vector2) { return new Vector2(this.x + v.x, this.y + v.y) }
    sub(v: Vector2) { return new Vector2(this.x - v.x, this.y - v.y) }
    mul(n: number) { return new Vector2(this.x * n, this.y * n) }
    mag() { return Math.sqrt(this.x * this.x + this.y * this.y) }
    norm() {
        const m = this.mag()
        return m === 0 ? new Vector2(0, 0) : new Vector2(this.x / m, this.y / m)
    }
}

export class Entity {
    pos: Vector2
    vel: Vector2
    radius: number
    color: string
    dead: boolean = false

    constructor(x: number, y: number, radius: number, color: string) {
        this.pos = new Vector2(x, y)
        this.vel = new Vector2(0, 0)
        this.radius = radius
        this.color = color
    }

    update(dt: number) {
        this.pos = this.pos.add(this.vel.mul(dt))
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.beginPath()
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2)
        ctx.fillStyle = this.color
        ctx.fill()
        ctx.shadowBlur = 10
        ctx.shadowColor = this.color
        ctx.closePath()
        ctx.shadowBlur = 0
    }
}

export type PowerUpType = 'RAPID_FIRE' | 'SHIELD' | 'SPREAD'

export class PowerUp extends Entity {
    type: PowerUpType
    life: number = 10 // Disappear after 10s if not collected

    constructor(x: number, y: number, type: PowerUpType) {
        let color = '#fff'
        if (type === 'RAPID_FIRE') color = '#ff9900' // Orange
        if (type === 'SHIELD') color = '#00ffff' // Cyan
        if (type === 'SPREAD') color = '#ff00ff' // Magenta
        super(x, y, 8, color)
        this.type = type
    }

    update(dt: number) {
        this.life -= dt
    }
}

export class Player extends Entity {
    rotation: number = 0
    cooldown: number = 0
    powerups: Map<PowerUpType, number> = new Map()

    constructor(x: number, y: number) {
        super(x, y, 10, '#0ff')
    }

    update(dt: number) {
        super.update(dt)
        // Friction
        this.vel = this.vel.mul(0.95)
        if (this.cooldown > 0) this.cooldown -= dt

        // Update Powerups
        for (const [type, timer] of this.powerups) {
            if (timer > 0) {
                this.powerups.set(type, timer - dt)
            } else {
                this.powerups.delete(type)
            }
        }
    }

    hasPowerUp(type: PowerUpType): boolean {
        return this.powerups.has(type)
    }

    addPowerUp(type: PowerUpType, duration: number) {
        this.powerups.set(type, duration)
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.pos.x, this.pos.y)
        ctx.rotate(this.rotation)

        // Draw Shield
        if (this.hasPowerUp('SHIELD')) {
            ctx.beginPath()
            ctx.arc(0, 0, 22, 0, Math.PI * 2)
            ctx.strokeStyle = '#00ffff'
            ctx.lineWidth = 2
            ctx.shadowBlur = 10
            ctx.shadowColor = '#00ffff'
            ctx.stroke()
            ctx.shadowBlur = 0
        }

        // Draw Rapid Fire Ring
        if (this.hasPowerUp('RAPID_FIRE')) {
            ctx.beginPath()
            ctx.arc(0, 0, 18, 0, Math.PI * 2)
            ctx.strokeStyle = '#ff9900'
            ctx.lineWidth = 2
            ctx.setLineDash([5, 5])
            ctx.stroke()
            ctx.setLineDash([])
        }

        // Draw Spread Ring
        if (this.hasPowerUp('SPREAD')) {
            ctx.beginPath()
            ctx.arc(0, 0, 14, 0, Math.PI * 2)
            ctx.strokeStyle = '#ff00ff'
            ctx.lineWidth = 2
            ctx.stroke()
        }

        // Draw Ship
        ctx.beginPath()
        ctx.moveTo(15, 0)
        ctx.lineTo(-10, 10)
        ctx.lineTo(-5, 0)
        ctx.lineTo(-10, -10)
        ctx.closePath()

        ctx.fillStyle = this.color
        ctx.shadowBlur = 15
        ctx.shadowColor = this.color
        ctx.fill()

        ctx.restore()
    }
}

export class Bullet extends Entity {
    constructor(x: number, y: number, vel: Vector2, isEnemy: boolean = false) {
        super(x, y, 3, isEnemy ? '#f00' : '#ff0')
        this.vel = vel
    }
}

export type EnemyType = 'NORMAL' | 'SHOOTER' | 'DASHER' | 'TANK'

export class Enemy extends Entity {
    speedMultiplier: number = 1.0
    type: EnemyType
    shootTimer: number = 0
    hp: number = 1

    constructor(x: number, y: number, type: EnemyType = 'NORMAL') {
        let radius = 12
        let color = '#f0f'
        let hp = 1

        if (type === 'SHOOTER') {
            color = '#0f0' // Green
            radius = 12
        } else if (type === 'DASHER') {
            color = '#ff0' // Yellow
            radius = 8
        } else if (type === 'TANK') {
            color = '#f00' // Red
            radius = 20
            hp = 3
        }

        super(x, y, radius, color)
        this.type = type
        this.hp = hp
    }

    update(dt: number, target?: Vector2) {
        if (target) {
            let speed = 0.2
            if (this.type === 'DASHER') speed = 0.4
            if (this.type === 'TANK') speed = 0.1
            if (this.type === 'SHOOTER') speed = 0.15

            const dist = target.sub(this.pos).mag()

            // Shooter behavior: Stop at distance to shoot
            if (this.type === 'SHOOTER' && dist < 200 && dist > 100) {
                this.vel = this.vel.mul(0.9) // Slow down
            } else {
                const dir = target.sub(this.pos).norm()
                this.vel = this.vel.add(dir.mul(speed * this.speedMultiplier)) // Acceleration
            }

            this.vel = this.vel.mul(0.98) // Friction

            if (this.type === 'SHOOTER') {
                this.shootTimer -= dt
            }
        }
        super.update(dt)
    }
}

export class Particle extends Entity {
    life: number
    maxLife: number

    constructor(x: number, y: number, color: string, speed: number, life: number) {
        super(x, y, Math.random() * 3 + 1, color)
        const angle = Math.random() * Math.PI * 2
        this.vel = new Vector2(Math.cos(angle), Math.sin(angle)).mul(speed)
        this.life = life
        this.maxLife = life
    }

    update(dt: number) {
        this.life -= dt
        this.vel = this.vel.mul(0.95) // Friction
        super.update(dt)
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife)
        super.draw(ctx)
        ctx.globalAlpha = 1.0
    }
}
