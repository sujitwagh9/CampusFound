import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import helmet from 'helmet'
import { config, cloudinaryEnabled } from './config.js'
import { ITEM_CATEGORIES } from './models/item.model.js'
import { MAX_IMAGES } from './middlewares/upload.middleware.js'
import userRoutes from './routes/user.route.js'
import itemRoutes from './routes/item.route.js'
import adminRoutes from './routes/admin.route.js'
import errorHandlingMiddleware from './middlewares/errorHandler.middleware.js'

const app = express()

app.set('trust proxy', 1) // correct client IPs for rate limiting behind a proxy
app.use(helmet())
app.use(cors({ origin: config.corsOrigins }))
app.use(express.json({ limit: '100kb' }))

// Used by Render's health checks and uptime monitors (which also keep a free instance awake)
app.get('/api/health', (req, res) => {
    const db = ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState] || 'unknown';
    res.status(db === 'connected' ? 200 : 503).json({ ok: db === 'connected', db });
});

// Lets the frontend adapt to how this server is configured
app.get('/api/meta', (req, res) => {
    res.json({
        categories: ITEM_CATEGORIES,
        uploadsEnabled: cloudinaryEnabled,
        maxImages: MAX_IMAGES,
        allowedEmailDomains: config.allowedEmailDomains,
        googleClientId: config.google.clientId || null,
    });
});

app.use('/api', userRoutes);
app.use('/api', itemRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use(errorHandlingMiddleware);

export default app;
