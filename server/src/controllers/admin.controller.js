import Ride from "../models/ride.model.js";

//get admin metrics(rides)
export const getAdminMetrics = async (req, res) => {
    try {
        const rides = await Ride.find();

        //we  get total number of rides
        const totalRides = rides.length;

        //all requested rides
        const requestedRides = rides.filter(r => r.status === "REQUESTED").length;

        //all active rides
        const activeRides = rides.filter(r => r.status ==="ACCEPTED" || r.status === "DRIVER_ARRIVING" || r.status === "STARTED").length;

        //completed and cancelled rides
        const completedRides = rides.filter(r => r.status === "COMPLETED").length;
        const cancelledRides = rides.filter(r => r.status === "CANCELLED").length;

        const totalCompletedRevenue = rides.filter(r => r.status === "COMPLETED").reduce((total, curr) => total + curr.estimatedFare, 0);
        return res.status(200).json({ totalRides, requestedRides, activeRides, completedRides, cancelledRides, totalCompletedRevenue });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const getAdminRides = async (req, res) => {
  try {
    const { status, driver, customer, date } = req.query;

    const filter = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Filter by driver
    if (driver) {
      filter.driverId = driver;
    }

    // Filter by customer
    if (customer) {
      filter.customerId = customer;
    }

    //filter by date
    if (date) {
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const endOfDay = new Date(`${date}T23:59:59.999Z`);

      filter.createdAt = {
        $gte: startOfDay,
        $lte: endOfDay,
      };
    }

    const rides = await Ride.find(filter)
      .populate("customerId", "name email")
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