import rateLimit from "express-rate-limit";

const skipInTest = () => process.env.NODE_ENV === "test";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: "Too many requests, please try again later" },
});

//a tighter limit for login/signup
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTest,
  message: { message: "Too many attempts, please try again later" },
});