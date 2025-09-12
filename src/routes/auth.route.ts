import { Router } from "express";
import {
  CLogin,
  CCreate,
  CUpdate,
  CDelete,
} from "../controllers/auth.controller.js";
import { MValidate } from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  loginSchema,
} from "../schemas/auth.schema.js";

const router = Router();

router.post("/login", MValidate(loginSchema, "body"), CLogin);
router.post("/create", MValidate(createUserSchema, "body"), CCreate);
router.put(
  "/:id",
  MValidate(userIdParamSchema, "params"),
  MValidate(updateUserSchema, "body"),
  CUpdate
);
router.delete("/:id", MValidate(userIdParamSchema, "params"), CDelete);

router.get("/test", (req, res) => {
  res.json({ message: "Test route" });
});

export default router;
