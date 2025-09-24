import { Router } from "express";
import {
  CClaimQueue,
  CReleaseQueue,
  CGetCurrentQueues,
  CNextQueue,
  CSkipQueue,
  CResetQueues,
  CGetMetrics,
} from "../controllers/queue.controller";
import { MValidate } from "../middlewares/validate.middleware";
import { MAuthenticate } from "../middlewares/authenticate.middleware";
import {
  VNextQueueSchema,
  VResetQueueSchema,
  VSkipQueueSchema,
} from "../validations/validation";

const router = Router();

router.get("/metrics", CGetMetrics);
router.post("/claim", CClaimQueue);
router.post("/release", CReleaseQueue);
router.get("/current", CGetCurrentQueues);

router.post("/next", MAuthenticate, MValidate(VNextQueueSchema), CNextQueue);
router.post("/skip", MAuthenticate, MValidate(VSkipQueueSchema), CSkipQueue);
router.post(
  "/reset",
  MAuthenticate,
  MValidate(VResetQueueSchema),
  CResetQueues
);

export default router;
