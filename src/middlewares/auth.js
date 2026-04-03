import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

// Middleware to verify and refresh tokens
const verifyToken = async (req, res, next) => {
    try {
        // Get tokens from cookies
        const accessToken = req.cookies?.accessToken;
        const refreshToken = req.cookies?.refreshToken;

        // If no access token, check refresh token
        if (!accessToken) {
            if (!refreshToken) {
                return res.status(401).json({ message: 'Unauthorized: No tokens provided' });
            }

            // Try to refresh the access token
            try {
                const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                const user = await User.findById(decoded.id);

                if (!user || user.refreshtoken !== refreshToken) {
                    return res.status(401).json({ message: 'Unauthorized: Invalid refresh token' });
                }

                // Generate new access token
                const newAccessToken = user.generateAccesstoken();

                // Set new access token in cookie
                res.cookie('accessToken', newAccessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'Strict',
                    maxAge: 10 * 60 * 1000 // 10 minutes
                });

                req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
                req.newAccessToken = newAccessToken;
                next();
            } catch (error) {
                return res.status(401).json({ message: 'Unauthorized: Invalid or expired refresh token' });
            }
        } else {
            // Verify access token
            try {
                const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
                req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
                next();
            } catch (error) {
                // Access token expired, try to use refresh token
                if (!refreshToken) {
                    return res.status(401).json({ message: 'Unauthorized: Access token expired and no refresh token' });
                }

                try {
                    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    const user = await User.findById(decoded.id);

                    if (!user || user.refreshtoken !== refreshToken) {
                        return res.status(401).json({ message: 'Unauthorized: Invalid refresh token' });
                    }

                    // Generate new access token
                    const newAccessToken = user.generateAccesstoken();

                    // Set new access token in cookie
                    res.cookie('accessToken', newAccessToken, {
                        httpOnly: true,
                        secure: process.env.NODE_ENV === 'production',
                        sameSite: 'Strict',
                        maxAge: 10 * 60 * 1000 // 10 minutes
                    });

                    req.user = { id: decoded.id, email: decoded.email, username: decoded.username };
                    req.newAccessToken = newAccessToken;
                    next();
                } catch (refreshError) {
                    return res.status(401).json({ message: 'Unauthorized: Both tokens invalid or expired' });
                }
            }
        }
    } catch (error) {
        return res.status(500).json({ message: 'Token verification error: ' + error.message });
    }
};

export { verifyToken };
