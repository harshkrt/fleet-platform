import jwt from 'jsonwebtoken';

//authenitcation logic
export const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Invalid authorization header' });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "invalid token" });
    }
};

//authorization logic
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication is required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: " you are not authorized to acces this resource" });
        }

        next();
    }
};
