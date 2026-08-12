import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
    customerId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    driverId: {type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null},
    pickupLocation: {type: String, required: true},
    dropLocation: {type: String, required: true},
    estimatedDistance: {type: Number, required: true},
    estimatedFare: {type: Number, required: true},
    notes: {type: String, default: ""},
    status: {
        type: String,
        enum: ['REQUESTED', 'ACCEPTED', 'DRIVER_ARRIVING', 'STARTED', 'COMPLETED', 'CANCELLED'],
        default: 'REQUESTED'
    },
    requestedTime: {type: Date, default: Date.now}
}, {timestamps: true});

const Ride = mongoose.models.Ride || mongoose.model("Ride", rideSchema);
export default Ride;