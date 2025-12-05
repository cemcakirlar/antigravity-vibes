import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()

// Middleware
app.use('*', logger())
app.use('*', cors())

// Routes
app.get('/', (c) => {
    return c.json({
        message: 'Welcome to Orion Backend! 🚀',
        version: '0.0.1',
        timestamp: new Date().toISOString()
    })
})

app.get('/health', (c) => {
    return c.json({ status: 'ok', uptime: process.uptime() })
})

// API routes
const api = new Hono()

api.get('/users', (c) => {
    return c.json({ users: [] })
})

api.post('/users', async (c) => {
    const body = await c.req.json()
    return c.json({ message: 'User created', data: body }, 201)
})

app.route('/api', api)

// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404)
})

// Error handler
app.onError((err, c) => {
    console.error(`Error: ${err.message}`)
    return c.json({ error: err.message }, 500)
})

const port = process.env.PORT || 3000

console.log(`🚀 Server is running on http://localhost:${port}`)

export default {
    port,
    fetch: app.fetch,
}
