import { JwtHelper } from "../../utils/jwt.js";

export const identifyUser = (req, res, next) => {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Please log in.",
            });
        }

        const decoded = JwtHelper.verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Session expired or invalid. Please log in again.",
        });
    }
};

// Sets req.user if a valid token is present, otherwise just calls next()
// Used for routes where logged-in users get extra access (e.g. draft preview)
export const optionalAuth = (req, res, next) => {
    try {
        const token =
            req.cookies?.token ||
            req.headers.authorization?.split(" ")[1];

        if (token) {
            const decoded = JwtHelper.verifyToken(token);
            req.user = decoded;
        }
    } catch {
        // Invalid token — treat as unauthenticated, don't block
        req.user = null;
    }
    next();
};