import express, { Express } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";
import routes from "./routes";
import { MErrorHandler } from "./middlewares/error.middleware";
import { connectRedis } from "./config/redis";

// Load environment variables
dotenv.config();

// Initialize Express app
const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(routes);

// Error handling middleware
app.use(MErrorHandler);

// Initialize Prisma client
const prisma = new PrismaClient();

// Start server
const startServer = async () => {
  try {
    // Connect to Redis
    await connectRedis();

    // Connect to Prisma
    await prisma.$connect();
    console.log("Database connected successfully");

    // Start Express server
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// Start the server
startServer();
