import bcrypt from "bcryptjs";
import User from "../src/models/user.model.js";

export const createUser = async ({
  name,
  email,
  password = "password123",
  role = "CUSTOMER",
}) => {
  const hashedPassword = await bcrypt.hash(password, 10);

  return User.create({
    name,
    email,
    password: hashedPassword,
    role,
  });
};

export const loginUser = async (request, email, password = "password123") => {
  const response = await request
    .post("/api/auth/login")
    .send({
      email,
      password,
    });

  return response.body.token;
};

export const createRideBody = () => ({
  pickupLocation: "Tezpur University",
  dropLocation: "Tezpur Railway Station",
  estimatedDistance: 12,
  estimatedFare: 170,
});