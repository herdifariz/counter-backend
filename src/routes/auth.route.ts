import { Router } from "express";
import { CLogin } from "../controllers/auth.controller.js";

const router = Router();

// POST /login
router.post("/login", CLogin);

export default router;
