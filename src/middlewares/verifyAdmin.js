import User from '../models/user.js'
import { verifyAccessToken } from '../services/tokenService.js';
import { errorHandler } from '../utils/errorHandler.js'; 

export const verifyAdmin = async (req, res, next) => {
    const token = req.cookies.accessToken;

    // Check if access token is present
    if (!token) return next(errorHandler(401, 'Access token not found'));

    const decoded = verifyAccessToken(req);
    if (!decoded) return next(errorHandler(401, 'Unauthorized'));

    try {
        // Find the user in the database
        const user = await User.findById(decoded.userId);

        // Check if user exists
        if (!user) {
            return next(errorHandler(400, 'No user found'));
        }

        // Check if the user is not an admin
        if (!user.isAdmin || user.role !== 'admin') {
            return next(errorHandler(403, 'You do not have permission to perform this action'));
        }

        // Attach user data to the request object for further use
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};
