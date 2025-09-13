import { Request, Response } from 'express';
import { redisClient } from '../config/redis';

/**
 * Initialize SSE connection for real-time updates
 */
export const CInitSSE = async (req: Request, res: Response): Promise<void> => {
  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // Send initial connection event
  res.write(`data: ${JSON.stringify({ event: 'connected' })}\n\n`);
  
  // Subscribe to Redis channel
  const subscriber = redisClient.duplicate();
  await subscriber.connect();
  
  await subscriber.subscribe('queue_updates', (message) => {
    res.write(`data: ${message}\n\n`);
  });
  
  // Handle client disconnect
  req.on('close', async () => {
    await subscriber.unsubscribe('queue_updates');
    await subscriber.quit();
  });
};