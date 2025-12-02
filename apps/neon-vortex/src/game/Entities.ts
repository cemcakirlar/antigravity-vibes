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

export class Player extends Entity {
    rotation: number = 0
    cooldown: number = 0

    constructor(x: number, y: number) {
        super(x, y, 10, '#0ff')
    }

    update(dt: number) {
        super.update(dt)
        // Friction
        this.vel = this.vel.mul(0.95)
        if (this.cooldown > 0) this.cooldown -= dt
    }

    draw(ctx: CanvasRenderingContext2D) {
        ctx.save()
        ctx.translate(this.pos.x, this.pos.y)
        ctx.rotate(this.rotation)

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
    constructor(x: number, y: number, vel: Vector2) {
        super(x, y, 3, '#ff0')
        this.vel = vel
    }
}

export class Enemy extends Entity {
    speedMultiplier: number = 1.0

    constructor(x: number, y: number) {
        super(x, y, 12, '#f0f')
    }

    update(dt: number, target?: Vector2) {
        if (target) {
            const dir = target.sub(this.pos).norm()
            this.vel = this.vel.add(dir.mul(0.2 * this.speedMultiplier)) // Acceleration
            this.vel = this.vel.mul(0.98) // Friction
        }
        super.update(dt)
    }
}
