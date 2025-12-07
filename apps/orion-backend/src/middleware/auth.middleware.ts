import { Context, Next } from 'hono'
import { authService, type AuthPayload } from '../modules/auth/auth.service'
import type { User } from '../db'

// Extended context type with user data
export interface AuthContext extends Context {
    get(key: 'authPayload'): AuthPayload
    get(key: 'user'): Omit<User, 'passwordHash'>
    set(key: 'authPayload', value: AuthPayload): void
    set(key: 'user', value: Omit<User, 'passwordHash'>): void
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user to context
 */
export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ success: false, error: 'Missing or invalid authorization header' }, 401)
    }

    const token = authHeader.slice(7)

    try {
        const payload = await authService.verifyToken(token)
        c.set('authPayload', payload)

        // Fetch full user data
        const user = await authService.getUserById(payload.userId)

        if (!user) {
            return c.json({ success: false, error: 'User not found' }, 401)
        }

        c.set('user', user)
        await next()
    } catch {
        return c.json({ success: false, error: 'Invalid or expired token' }, 401)
    }
}
