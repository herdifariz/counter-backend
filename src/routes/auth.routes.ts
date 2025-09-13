import { Router } from "express";
import {
  CLogin,
  CCreateAdmin,
  CUpdateAdmin,
  CDeleteAdmin,
} from "../controllers/auth.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import { VAdminSchema, VBaseID, VLoginSchema } from "../validations/validation";

const router = Router();

// Public route for login
router.post("/login", MValidate(VLoginSchema), CLogin);

// Protected admin management routes
router.post("/create", MAuthenticate, MValidate(VAdminSchema), CCreateAdmin);
router.put(
  "/:id",
  MAuthenticate,
  MValidate(VBaseID, "params"),
  MValidate(VAdminSchema),
  CUpdateAdmin
);
router.delete("/:id", MAuthenticate, CDeleteAdmin);

export default router;
