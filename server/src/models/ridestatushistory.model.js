import mongoose from "mongoose";

const rideStatusHistorySchema = new mongoose.Schema({
  rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", required: true },
  previousStatus: { type: String },
  newStatus: { type: String },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  timestamp: { type: Date, default: Date.now },
});

const RideStatusHistory = mongoose.models.RideStatusHistory || mongoose.model("RideStatusHistory", rideStatusHistorySchema);
export default RideStatusHistory;
