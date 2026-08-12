import Ride from "../models/ride.model.js";
import RideStatusHistory from "../models/ridestatushistory.model.js";
import { isValidTransition } from "../utils/stateMachine.js";

//create ride(by customer)
export const createRide = async (req, res) => {

    try {
        const { pickupLocation, dropLocation, estimatedDistance, requestedTime, notes } = req.body;

        if (!pickupLocation || !dropLocation || !estimatedDistance || !requestedTime) {
            return res.status(400).json({ message: "All fields are required" });
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}  

//get ride
export const getAvailableRides = async (req, res) => {
    try {
        const rides = await Ride.find({ status: "REQUESTED" }).populate("customerId", "name email");
        return res.status(200).json({ rides, });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

//accept ride(by driver)
export const acceptRide = async (req, res) => {
    try {
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
                    return res.status(404).json({ message: "Ride not found" });
                }
                return res.status(409).json({ message: "Ride no longer available" });
            }

            await RideStatusHistory.create({
                rideId: ride._id,
                previousStatus: "REQUESTED",
                newStatus: "ACCEPTED",
                changedBy: driverId,
            });

            return res.status(200).json({ message: "Ride accepted successfully", ride });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


//update status of ride(by driver)
export const updateRideStatus = async (req, res) => {
    try {
        const rideId = req.params.id;
        const driverId = req.user.id;
        const {status:newStatus} = req.body;

        const ride = await Ride.findById(rideId);
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        //we ensure driver is assigned to the ride
        if (ride.driverId.toString() !== driverId) {
            return res.status(403).json({msg: "you are not assigned this ride"});
        }

        if (!isValidTransition(ride.status, newStatus)) {
            return res.status(400).json({ message: `Invalid status transition from ${ride.status} to ${newStatus}` });
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
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}


//getting rides assigned to the logged-in driver
export const getAssignedRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      driverId: req.user.id,
    })
      .populate("customerId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

//getting rides belonging to the logged-in customer
export const getMyRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      customerId: req.user.id,
    })
      .populate("driverId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: rides.length,
      rides,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// Get a single ride with its status history
export const getRideDetails = async (req, res) => {
  try {
    const rideId = req.params.id;
    const userId = req.user.id;

    const ride = await Ride.findById(rideId)
      .populate("customerId", "name email")
      .populate("driverId", "name email");

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    // Customer can only access their own ride
    if (ride.customerId._id.toString() !== userId) {
      return res.status(403).json({
        message: "You are not authorized to view this ride",
      });
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

export const cancelRide = async (req, res) => {
  try {
    const rideId = req.params.id;
    const customerId = req.user.id;

    const ride = await Ride.findById(rideId);

    if (!ride) {
      return res.status(404).json({
        message: "Ride not found",
      });
    }

    // Make sure this customer owns the ride
    if (ride.customerId.toString() !== customerId) {
      return res.status(403).json({
        message: "You are not authorized to cancel this ride",
      });
    }

    // Reuse the state machine
    if (!isValidTransition(ride.status, "CANCELLED")) {
      return res.status(400).json({
        message: `Ride cannot be cancelled from ${ride.status} status`,
      });
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
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};