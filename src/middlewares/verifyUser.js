import User from '../models/user.js';
import { verifyAccessToken } from '../services/tokenService.js';
import { errorHandler } from '../utils/errorHandler.js';

export const verifyUser = async (req, res, next) => {
  const token = req.cookies.accessToken;

  if (!token) return next(errorHandler(401, 'Acess token not found'));

  const decoded = verifyAccessToken(req);
  if (!decoded) next(errorHandler(401, 'Unauthorized'));

  try {
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = decoded;
    } else {
      return next(errorHandler(400, 'No User found'));
    }
    next();
  } catch (error) {
    next(error);
  }
};
