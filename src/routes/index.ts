import { Router } from 'express';
import authRoutes from './auth.routes';
import counterRoutes from './counter.routes';
import queueRoutes from './queue.routes';
import { CInitSSE } from '../controllers/sse.controller';

const router = Router();

// API version prefix
const API_PREFIX = '/api/v1';

// Authentication routes
router.use(`${API_PREFIX}/auth`, authRoutes);

// Counter routes
router.use(`${API_PREFIX}/counters`, counterRoutes);

// Queue routes
router.use(`${API_PREFIX}/queues`, queueRoutes);

// SSE route for real-time updates
router.get(`${API_PREFIX}/sse`, CInitSSE);

export default router;