import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { env, validateConfig } from './config/env.js';
import { connectDB } from './config/db.js';
import { initSocket } from './config/socket.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import campaignRoutes from './routes/campaignRoutes.js';
import callRoutes from './routes/callRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import aiAgentRoutes from './routes/aiAgentRoutes.js';
import knowledgeBaseRoutes from './routes/knowledgeBaseRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Initialize WebSockets
initSocket(server);

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, webhooks)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in local development
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Vobiz-Secret', 'X-Vobiz-Signature']
  })
);

// Logging
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Body Parsers
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static audio files & uploads directory
app.use('/audio', express.static(path.join(__dirname, 'uploads')));

// Safe Rate Limiting for auth APIs
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' }
});
app.use('/api/auth/login', authLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AI Voice Calling SaaS Backend'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/calls', callRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/agents', aiAgentRoutes);
app.use('/api/knowledge-base', knowledgeBaseRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/webhooks', webhookRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Boot Server
const startServer = async () => {
  try {
    validateConfig();
    await connectDB();

    server.listen(env.PORT, () => {
      console.log(`🚀 AI Voice Platform Backend running on http://localhost:${env.PORT}`);
    });
  } catch (err) {
    console.error('Fatal Server Boot Error:', err);
    process.exit(1);
  }
};

startServer();

export { app, server };
