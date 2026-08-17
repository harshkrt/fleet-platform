import dotenv from "dotenv";
dotenv.config();

import bcrypt from "bcryptjs";
import connectDB from "./config/db.js";
import User from "./models/user.model.js";

const USERS = [
  { name: "Carol Customer", email: "customer@example.com", role: "CUSTOMER" },
  { name: "Dave Driver", email: "driver@example.com", role: "DRIVER" },
    { name: "DriverX", email: "driverx@example.com", role: "DRIVER" },
  { name: "Alice Admin", email: "admin@example.com", role: "ADMIN" },
];

const PASSWORD = "password123";

const run = async () => {
  await connectDB();

  const hashedPassword = await bcrypt.hash(PASSWORD, 10);

  for (const user of USERS) {
    await User.findOneAndUpdate(
      { email: user.email },
      { ...user, password: hashedPassword },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    console.log(`Seeded ${user.role}: ${user.email} / ${PASSWORD}`);
  }

  await mongooseDisconnect();
};

const mongooseDisconnect = async () => {
  const mongoose = (await import("mongoose")).default;
  await mongoose.connection.close();
};

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
