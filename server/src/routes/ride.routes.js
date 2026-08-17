import express from "express";

import {
  createRide,
  getMyRides,
  getAssignedRides,
  getRideDetails,
  getAvailableRides,
  acceptRide,
  updateRideStatus,
  cancelRide,
} from "../controllers/ride.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", authenticate, authorize("CUSTOMER"), createRide);
router.get("/my", authenticate, authorize("CUSTOMER"), getMyRides);
router.get("/available", authenticate, authorize("DRIVER"), getAvailableRides);
router.get("/assigned", authenticate, authorize("DRIVER"), getAssignedRides);
router.get("/:id", authenticate, authorize("CUSTOMER"), getRideDetails);
router.post("/:id/cancel", authenticate, authorize("CUSTOMER"), cancelRide);
router.post("/:id/accept", authenticate, authorize("DRIVER"), acceptRide);
router.patch("/:id/status", authenticate, authorize("DRIVER"), updateRideStatus);

export default router;
