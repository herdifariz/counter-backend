import { Router } from "express";
import {
  CCreateCounter,
  CDeleteCounter,
  CGetAllCounters,
  CGetCounterDetails,
  CUpdateCounter,
  CUpdateCounterStatus,
} from "../controllers/counter.controller.js";

const router = Router();
router.get("/", CGetAllCounters);
router.get("/:id", CGetCounterDetails);
router.post("/", CCreateCounter);
router.put("/:id", CUpdateCounter);
router.patch("/:id/status", CUpdateCounterStatus);
router.delete("/:id", CDeleteCounter);

export default router;
