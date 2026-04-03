import uploader from '../utils/Cloudinary.js';
import User from '../models/user.model.js';
import bcrypt from 'bcrypt';

const registerUserService = async (username, email, fullname, password, avatarPath, coverImagePath) => {
    const avatar = await uploader(avatarPath);
    const coverimage = await uploader(coverImagePath);

    if (!avatar || !coverimage) {
        throw new Error("Error uploading images");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
        username: username.toLowerCase(),
        email,
        fullname,
        password: hashedPassword,
        avatar: avatar.url,
        coverimage: coverimage.url,
    });

    const userinform = await newUser.save();
    const usercreated = await User.findById(userinform._id).select("-password -refreshtoken");
    return usercreated;
};

const loginUserService = async (email, password) => {
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error("Invalid username or password");
    }

    const passwordcheck = await user.isPasswordCorrect(password);
    if (!passwordcheck) {
        throw new Error("Invalid username or password");
    }

    const accessToken = user.generateAccesstoken();
    const refreshToken = user.generateRefreshtoken();

    user.refreshtoken = refreshToken;
    await user.save();

    const usersafe = await User.findById(user._id).select("-password -refreshtoken");
    return { accessToken, refreshToken, user: usersafe };
};

export { registerUserService, loginUserService };