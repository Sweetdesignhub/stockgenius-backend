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

import jwt from 'jsonwebtoken';
import { errorHandler } from '../utils/errorHandler.js';

export const verifyToken = (req, res, next) => {
    const token = req.cookies.access_token;
    // console.log('Token received:', req.cookies);

    if (!token) {
        return next(errorHandler(401, 'You are not authenticated!'));
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token verification error:', err);
            return next(errorHandler(403, 'Token is not valid!'));
        }

        req.user = decoded; 
        next();
    });
};

