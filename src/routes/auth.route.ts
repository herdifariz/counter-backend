import { Router } from "express";
import { CLogin } from "../controllers/auth.controller.js";

const router = Router();

// POST /login
router.post("/login", CLogin);

router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!" });
});

export default router;
