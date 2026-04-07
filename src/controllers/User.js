import { registerUserService, loginUserService, updateUserService } from '../service/userService.js';
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

        return res.status(200).json({ message: "User logged in successfully", accessToken, refreshToken, user });

    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(401).json({ message: error.message || "Invalid username or password" });
    }
};

// Refresh token endpoint
const refreshAccessToken = async (req, res) => {
    try {
        const refreshToken = req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({ message: "Refresh token not found" });
        }

        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
        const user = await User.findById(decoded.id);

        if (!user || user.refreshtoken !== refreshToken) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = user.generateAccesstoken();

        return res.status(200).json({ message: "Token refreshed successfully", accessToken: newAccessToken });

    } catch (error) {
        console.error("Error refreshing token:", error);
        return res.status(401).json({ message: "Token refresh failed: " + error.message });
    }
};

// Logout endpoint
const Logoutuser = async (req, res) => {
    try {
        return res.status(200).json({ message: "User logged out successfully" });
    } catch (error) {
        console.error("Error logging out:", error);
        return res.status(500).json({ message: "Logout failed: " + error.message });
    }
};

// Get current user profile
const getCurrentUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password -refreshtoken');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Update user profile
const updateUserProfile = async (req, res) => {
    try {
        const { fullname } = req.body;
        const avatarlocalpath = req.files?.avatar?.[0]?.path;
        const coverimagelocalpath = req.files?.coverimage?.[0]?.path;

        const updateData = {};
        if (fullname) updateData.fullname = fullname;
        if (avatarlocalpath) updateData.avatarPath = avatarlocalpath;
        if (coverimagelocalpath) updateData.coverImagePath = coverimagelocalpath;

        const user = await updateUserService(req.user.id, updateData);
        return res.status(200).json({ message: "Profile updated successfully", user });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return res.status(500).json({ message: error.message || "Internal server error" });
    }
};

// Change password
const changePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: "Old password and new password are required" });
        }

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Old password is incorrect" });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export { Registeruser, Loginuser, refreshAccessToken, Logoutuser, getCurrentUserProfile, updateUserProfile, changePassword };