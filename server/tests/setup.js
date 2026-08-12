import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

beforeAll(async () => {
  console.log("Connecting to test MongoDB...");

  try {
    await mongoose.connect(process.env.MONGO_TEST_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(
      "MongoDB connected:",
      mongoose.connection.readyState === 1
    );
  } catch (error) {
    console.error("TEST DB CONNECTION FAILED:", error);
    throw error;
  }
}, 10000);

beforeEach(async () => {
  const collections = mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }
});