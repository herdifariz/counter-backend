import { Router } from "express";
import {
  CClaimedQueue,
  CCreateQueue,
  CDeleteQueue,
  CGetAllQueue,
  CGetQueueDetails,
  CNextQueue,
  CUpdateQueue,
} from "../controllers/queue.controller.js";

const router = Router();

router.get("/", CGetAllQueue);
router.get("/:id", CGetQueueDetails);
router.post("/", CCreateQueue);
router.put("/:id", CUpdateQueue);
router.delete("/:id", CDeleteQueue);
router.post("/claim", CClaimedQueue);
router.post("/next/:counterId", CNextQueue);

export default router;
