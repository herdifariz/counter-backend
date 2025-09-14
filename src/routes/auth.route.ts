import { Router } from "express";
import {
  CLogin,
  CCreate,
  CUpdate,
  CDelete,
  CGetAllAdmins,
} from "../controllers/auth.controller.js";
import { MValidate } from "../middleware/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
  loginSchema,
} from "../schemas/auth.schema.js";
import {
  MCache,
  MInvalidateCache,
  CachePresets,
} from "../middleware/cache.middleware.js";

const router = Router();

router.post("/login", MValidate(loginSchema, "body"), CLogin);
router.post(
  "/create",
  MValidate(createUserSchema, "body"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  CCreate
);
router.put(
  "/:id",
  MValidate(userIdParamSchema, "params"),
  MValidate(updateUserSchema, "body"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  CUpdate
);
router.delete(
  "/:id",
  MValidate(userIdParamSchema, "params"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  CDelete
);
router.get("/", MCache(CachePresets.user()), CGetAllAdmins);

router.get("/test", (req, res) => {
  res.json({ message: "Test route" });
});

export default router;
