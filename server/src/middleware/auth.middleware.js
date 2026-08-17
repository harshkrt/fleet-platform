import jwt from 'jsonwebtoken';
import { AppError } from '../utils/AppError.js';

//authenitcation logic
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AppError('Invalid authorization header', 401);
    }

    const token = authHeader.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
};

//authorization logic
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            throw new AppError('Authentication is required', 401);
        }

        if (!allowedRoles.includes(req.user.role)) {
            throw new AppError('You are not authorized to access this resource', 403);
        }

        next();
    }
};
