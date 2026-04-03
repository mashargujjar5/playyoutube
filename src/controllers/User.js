import { registerUserService, loginUserService } from '../service/userService.js';
import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const Registeruser = async (req, res) => {
    try {
        console.log("[Registeruser] req.body:", req.body);
        console.log("[Registeruser] req.files:", req.files);

        const { username, email, fullname, password } = req.body;
        if (!username || !email || !fullname || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: "Username or email already exists" });
        }

        const avatarlocalpath = req.files?.avatar?.[0]?.path || null;
        const coverimagelocalpath = req.files?.coverimage?.[0]?.path || null;
        if (!avatarlocalpath) {
            return res.status(400).json({ message: "Avatar image is required" });
        }
        if (!coverimagelocalpath) {
            return res.status(400).json({ message: "Cover image is required" });
        }

        const usercreated = await registerUserService(username, email, fullname, password, avatarlocalpath, coverimagelocalpath);

        console.log(usercreated);

        return res.status(201).json({ message: "User registered successfully", user: usercreated });

    } catch (error) {
        console.error("Error registering user:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

//login user
// take username and password from req.body
// check if username and password are provided
// find user by username
// if user not found return 404
// compare password with hashed password in database
// if password is incorrect return 401
// if password is correct return user data without password and refreshtoken
const Loginuser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required" });
        }

        const { accessToken, refreshToken, user } = await loginUserService(email, password);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000 // 10 minutes for access token
        };
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days for refresh token
        })
        .cookie('accessToken', accessToken, cookieOptions);

        return res.status(200).json({ message: "User logged in successfully", accessToken, user });

    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(401).json({ message: error.message || "Invalid username or password" });
    }
};

// Refresh token endpoint
const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshtoken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = user.generateAccesstoken();

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 10 * 60 * 1000 // 10 minutes
        };

        res.cookie('accessToken', newAccessToken, cookieOptions);
        return res.status(200).json({ message: "Token refreshed successfully", accessToken: newAccessToken });

    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Token refresh failed: " + error.message });
    }
};

// Logout endpoint
const Logoutuser = async (req, res) => {
    try {
        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        
        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error logging out:", error);
        return res.status(500).json({ message: "Logout failed: " + error.message });
    }
};

export { Registeruser, Loginuser, refreshAccessToken, Logoutuser };