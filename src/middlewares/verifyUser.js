// import jwt from 'jsonwebtoken';
// import { errorHandler } from '../utils/errorHandler.js';

// export const verifyToken = (req, res, next) => {
//     const token = req.cookies.access_token;
//     console.log('Token received:', req.cookies);

//     if (!token) {
//         return next(errorHandler(401, 'You are not authenticated!'));
//     }

//     jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
//         if (err) {
//             console.error('Token verification error:', err);
//             return next(errorHandler(403, 'Token is not valid!'));
//         }

//         req.user = user;
//         next();
//     });
// };

import User from '../models/user.js';
import { errorHandler } from '../utils/errorHandler.js';

export const verifyUser = async (req, res, next) => {
  const token = req.cookies.access_token;

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
