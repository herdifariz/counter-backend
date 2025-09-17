import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.route.js";
import counterRoutes from "./routes/counter.route.js";
import { MErrorHandler } from "./middleware/error.middleware.js";
import { connectRedis } from "./configs/redis.config.js";
import { initializeCronJobs } from "./configs/scheduler.config.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1/auth/", authRoutes);
app.use("/api/v1/counters/", counterRoutes);

app.use(MErrorHandler);

// Start server
app.listen(PORT, () => {
  connectRedis();
  console.log(`Server is running on http://localhost:${PORT}`);
  initializeCronJobs();
});
