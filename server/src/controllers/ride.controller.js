import Ride from "../models/ride.model.js";
import RideStatusHistory from "../models/ridestatushistory.model.js";
import { isValidTransition } from "../utils/stateMachine.js";
import { AppError } from "../utils/AppError.js";

//create ride(by customer)
export const createRide = async (req, res) => {
    const { pickupLocation, dropLocation, estimatedDistance, requestedTime, notes } = req.body;

    if (!pickupLocation || !dropLocation || !estimatedDistance || !requestedTime) {
        throw new AppError("All fields are required", 400);
    }

    if (estimatedDistance <= 0) {
      throw new AppError("Distance must be greater than 0", 400);
    }

    const baseFare = 50;
    const farePerKM = 10;
    const estimatedFare = baseFare + estimatedDistance * farePerKM;

    const ride = await Ride.create({
        customerId: req.user.id,
        pickupLocation,
        dropLocation,
        estimatedDistance,
        estimatedFare,
        requestedTime,
        notes: notes || "",
        status: "REQUESTED",
    });

    return res.status(201).json({ message: "Ride requested successfully", ride });
}

//get ride
export const getAvailableRides = async (req, res) => {
    const rides = await Ride.find({ status: "REQUESTED" }).populate("customerId", "name email");
    return res.status(200).json({ rides });
}

//accept ride(by driver)
export const acceptRide = async (req, res) => {
    const rideId  = req.params.id;
    const driverId = req.user.id;

    const ride = await Ride.findOneAndUpdate(
        {
        _id: rideId,
        status: "REQUESTED"
        },
        {
            $set: {
                driverId: driverId,
                status: "ACCEPTED",
            },
        },
        {
            returnDocument: "after",
        });

        if (!ride) {
            const existingRide = await Ride.findById(rideId);
            if (!existingRide) {
                throw new AppError("Ride not found", 404);
            }
            throw new AppError("Ride no longer available", 409);
        }

        await RideStatusHistory.create({
            rideId: ride._id,
            previousStatus: "REQUESTED",
            newStatus: "ACCEPTED",
            changedBy: driverId,
        });

        return res.status(200).json({ message: "Ride accepted successfully", ride });
}


//update status of ride(by driver)
export const updateRideStatus = async (req, res) => {
    const rideId = req.params.id;
    const driverId = req.user.id;
    const {status:newStatus} = req.body;

    const ride = await Ride.findById(rideId);
    if (!ride) {
        throw new AppError("Ride not found", 404);
    }

    //we ensure driver is assigned to the ride
    if (!ride.driverId || ride.driverId.toString() !== driverId) {
        throw new AppError("You are not assigned to this ride", 403);
    }

    if (!isValidTransition(ride.status, newStatus)) {
        throw new AppError(`Invalid status transition from ${ride.status} to ${newStatus}`, 400);
    }

    //we change and update the state
    const previousStatus = ride.status;
    ride.status = newStatus;
    await ride.save();

    await RideStatusHistory.create({
        rideId: ride._id,
        previousStatus: previousStatus,
        newStatus: newStatus,
        changedBy: driverId,
    });

    return res.status(200).json({ message: "Ride status updated successfully", ride });
}


//getting rides assigned to the logged-in driver
export const getAssignedRides = async (req, res) => {
  const rides = await Ride.find({
    driverId: req.user.id,
  })
    .populate("customerId", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    count: rides.length,
    rides,
  });
};

//getting rides belonging to the logged-in customer
export const getMyRides = async (req, res) => {
  const rides = await Ride.find({
    customerId: req.user.id,
  })
    .populate("driverId", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json({
    count: rides.length,
    rides,
  });
};

// Get a single ride with its status history
export const getRideDetails = async (req, res) => {
  const rideId = req.params.id;
  const userId = req.user.id;

  const ride = await Ride.findById(rideId)
    .populate("customerId", "name email")
    .populate("driverId", "name email");

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  // Customer can only access their own ride
  if (ride.customerId._id.toString() !== userId) {
    throw new AppError("You are not authorized to view this ride", 403);
  }

  const history = await RideStatusHistory.find({
    rideId: ride._id,
  })
    .populate("changedBy", "name email role")
    .sort({ createdAt: 1 });

  return res.status(200).json({
    ride,
    history,
  });
};

export const cancelRide = async (req, res) => {
  const rideId = req.params.id;
  const customerId = req.user.id;

  const ride = await Ride.findById(rideId);

  if (!ride) {
    throw new AppError("Ride not found", 404);
  }

  // Make sure this customer owns the ride
  if (ride.customerId.toString() !== customerId) {
    throw new AppError("You are not authorized to cancel this ride", 403);
  }

  // Reuse the state machine
  if (!isValidTransition(ride.status, "CANCELLED")) {
    throw new AppError(`Ride cannot be cancelled from ${ride.status} status`, 400);
  }

  const previousStatus = ride.status;

  ride.status = "CANCELLED";
  await ride.save();

  // Record status change
  await RideStatusHistory.create({
    rideId: ride._id,
    previousStatus,
    newStatus: "CANCELLED",
    changedBy: customerId,
  });

  return res.status(200).json({
    message: "Ride cancelled successfully",
    ride,
  });
};