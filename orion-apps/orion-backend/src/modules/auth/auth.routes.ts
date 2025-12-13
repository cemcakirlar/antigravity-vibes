import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { authService } from './auth.service'
import { authMiddleware, type AuthContext } from '../../middleware/auth.middleware'

const auth = new Hono()

// Validation schemas
const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
})

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/auth/register
 * Register a new user
 */
auth.post('/register', zValidator('json', registerSchema), async (c) => {
    try {
        const input = c.req.valid('json')
        const result = await authService.register(input)

        return c.json({
            success: true,
            data: result,
        }, 201)
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Registration failed'
        return c.json({ success: false, error: message }, 400)
    }
})

/**
 * POST /api/auth/login
 * Login with email and password
 */
auth.post('/login', zValidator('json', loginSchema), async (c) => {
    try {
        const input = c.req.valid('json')
        const result = await authService.login(input)

        return c.json({
            success: true,
            data: result,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed'
        return c.json({ success: false, error: message }, 401)
    }
})

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
auth.get('/me', authMiddleware, async (c: AuthContext) => {
    const user = c.get('user')

    if (!user) {
        return c.json({ success: false, error: 'User not found' }, 404)
    }

    return c.json({
        success: true,
        data: { user },
    })
})

export { auth as authRoutes }
