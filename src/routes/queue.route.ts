import { Router } from "express";
import {
  CClaimQueue,
  CCreateQueue,
  CCurrentQueue,
  CDeleteQueue,
  CGetAllQueue,
  CGetQueueDetails,
  CNextQueue,
  CResetQueue,
  CSkipQueue,
  CUpdateQueue,
} from "../controllers/queue.controller.js";
import { MAuthenticate } from "../middleware/authenticate.middleware.js";
import { MValidate } from "../middleware/validate.middleware.js";
import { idParamSchema } from "../schemas/auth.schema.js";

const router = Router();

router.get("/", CGetAllQueue);
router.post("/", CCreateQueue);
router.post("/claim", CClaimQueue);
router.get("/current", CCurrentQueue);
router.post("/next/:counterId", MAuthenticate, CNextQueue);
router.post("/skip/:counterId", MAuthenticate, CSkipQueue);
router.post("/reset", MAuthenticate, CResetQueue);
router.get("/:id", MValidate(idParamSchema), CGetQueueDetails);
router.put("/:id", MValidate(idParamSchema), CUpdateQueue);
router.delete("/:id", MValidate(idParamSchema), CDeleteQueue);

export default router;
