import express from 'express';
import uploader from '../utils/Cloudinary.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
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
    const avatar = await uploader(avatarlocalpath);
    const coverimage = await uploader(coverimagelocalpath);
    if (!avatar || !coverimage) {
        return res.status(500).json({ message: "Error uploading images" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username: username.toLowerCase(),
        email,
        fullname,
        password: hashedPassword,
        avatar: avatar.url,
        coverimage: coverimage?.url || "",
    });
    const userinform = await newUser.save();
    const usercreated = await User.findById(userinform._id).select("-password -refreshtoken ");
    if (!usercreated) {
        return res.status(500).json({ message: "Error creating user" });
    }
    console.log(userinform);
    
    return res.status(201).json({ message: "User registered successfully", user: usercreated });



  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }




}

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

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid username or password" });
        }

        const passwordcheck = await user.isPasswordCorrect(password);
        if (!passwordcheck) {
            return res.status(401).json({ message: "Invalid username or password" });
        } 

        if (!process.env.ACCESS_TOKEN_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
            console.error("JWT secret is not configured in environment variables.");
            return res.status(500).json({ message: "Server configuration error" });
        }
        const accessToken = user.generateAccesstoken();
        const refreshToken = user.generateRefreshtoken();

        user.refreshtoken = refreshToken;
        await user.save();

        const cookieOptions = {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
        };
        res.cookie('refreshToken', refreshToken, cookieOptions)
        .cookie('accessToken', accessToken, cookieOptions);

        const usersafe = await User.findById(user._id).select("-password -refreshtoken");
        return res.status(200).json({ message: "User logged in successfully", accessToken, user: usersafe });
        

    } catch (error) {
        console.error("Error logging in user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export { Registeruser, Loginuser,Logoutuser };