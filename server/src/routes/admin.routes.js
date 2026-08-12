import express from "express";
import { getAdminMetrics, getAdminRides } from "../controllers/admin.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/metrics", authenticate, authorize("ADMIN"), getAdminMetrics);
router.get("/rides", authenticate, authorize("ADMIN"), getAdminRides);

export default router;