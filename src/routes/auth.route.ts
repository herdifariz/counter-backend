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
  idParamSchema,
  loginSchema,
} from "../schemas/auth.schema.js";
import {
  MCache,
  MInvalidateCache,
  CachePresets,
} from "../middleware/cache.middleware.js";
import { MAuthenticate } from "../middleware/authenticate.middleware.js";
import { SGetAdminDetails } from "../services/auth.services.js";

const router = Router();

router.post("/login", MValidate(loginSchema, "body"), CLogin);
router.post(
  "/create",
  MValidate(createUserSchema, "body"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  MAuthenticate,
  CCreate
);
router.get("/", MCache(CachePresets.user()), MAuthenticate, CGetAllAdmins);
router.put(
  "/:id",
  MValidate(idParamSchema, "params"),
  MValidate(updateUserSchema, "body"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  MAuthenticate,
  CUpdate
);
router.delete(
  "/:id",
  MValidate(idParamSchema, "params"),
  MInvalidateCache([`${CachePresets.user().keyPrefix}:*`]),
  MAuthenticate,
  CDelete
);
router.get(
  "/:id",
  MValidate(idParamSchema, "params"),
  MAuthenticate,
  SGetAdminDetails
);

export default router;
