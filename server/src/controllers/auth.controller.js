import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import { AppError } from "../utils/AppError.js";

// Register a new user
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError("Name, email and password are required", 400);
  }

  //Check if user already exists
  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("User already exists", 409);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Create customer
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    role: "CUSTOMER",
  });

  return res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordCorrect = await bcrypt.compare(password, user.password);
  if (!isPasswordCorrect) {
    throw new AppError("Invalid email or password", 401);
  }

  // Create JWT token
  const token = jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
};