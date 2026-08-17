import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import rideRoutes from "./routes/ride.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Fleet Booking API is running",
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/rides", rideRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;