import { Router } from "express";
import {
  CLogin,
  CCreate,
  CUpdate,
  CDelete,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/login", CLogin);
router.post("/create", CCreate);
router.put("/:id", CUpdate);
router.delete("/:id", CDelete);

router.get("/test", (req, res) => {
  res.json({ message: "Auth route is working!" });
});

export default router;
