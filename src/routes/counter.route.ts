import { Router } from "express";
import {
  CCreateCounter,
  CDeleteCounter,
  CGetAllCounters,
  CGetCounterDetails,
  CUpdateCounter,
  CUpdateCounterStatus,
} from "../controllers/counter.controller.js";
import { MAuthenticate } from "../middleware/authenticate.middleware.js";

const router = Router();

router.get("/", CGetAllCounters);
router.get("/:id", CGetCounterDetails);
router.post("/", MAuthenticate, CCreateCounter);
router.put("/:id", MAuthenticate, CUpdateCounter);
router.patch("/:id/status", MAuthenticate, CUpdateCounterStatus);
router.delete("/:id", MAuthenticate, CDeleteCounter);

export default router;
