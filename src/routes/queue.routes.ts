import { Router } from "express";
import {
  CClaimQueue,
  CReleaseQueue,
  CGetCurrentQueues,
  CNextQueue,
  CSkipQueue,
  CResetQueues,
} from "../controllers/queue.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import {
  VNextQueueSchema,
  VResetQueueSchema,
  VSkipQueueSchema,
} from "../validations/validation";

const router = Router();

// Public routes
router.post("/claim", CClaimQueue);
router.post("/release", CReleaseQueue);
router.get("/current", CGetCurrentQueues);

// Protected routes for queue management
router.post("/next", MAuthenticate, MValidate(VNextQueueSchema), CNextQueue);
router.post("/skip", MAuthenticate, MValidate(VSkipQueueSchema), CSkipQueue);
router.post(
  "/reset",
  MAuthenticate,
  MValidate(VResetQueueSchema),
  CResetQueues
);

export default router;
