import { Router } from "express";
import {
  CGetAllCounters,
  CGetCounterById,
  CCreateCounter,
  CUpdateCounter,
  CDeleteCounter,
} from "../controllers/counter.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import { VCounterSchema } from "../validations/validation";

const router = Router();

router.get("/", CGetAllCounters);

router.get("/:id", CGetCounterById);

router.post(
  "/create",
  MAuthenticate,
  MValidate(VCounterSchema),
  CCreateCounter
);
router.put("/:id", MAuthenticate, MValidate(VCounterSchema), CUpdateCounter);
router.delete("/:id", MAuthenticate, CDeleteCounter);

export default router;
