import e from "express";
import mongoose from "mongoose";
import { Schema } from "mongoose";

const userSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      require: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avator: {
      type: String,
      required: true,
    },
    coverimage: {
      type: String,
    },
    watchhistory: [
      {
        type: Schema.types.ObjectId,
        ref: "Video",
      },
    ],
    password: {
      type: String,
      required: true,
      trim: true,
      minLength: 8,
      maxLength: 15,
    },
    refreshtoken: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});
userSchema.methods.isPasswordCorrect= async function(password){
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccesstoken=function(){
    return jwt.sign({ id: this._id, email: this.email, username: this.username, fullname: this.fullname }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRATION,
    }); 
}
userSchema.methods.generateRefreshtoken=function(){
    return jwt.sign({ id: this._id, email: this.email, username: this.username, fullname: this.fullname }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRATION,
    }); 
}

 
export default mongoose.model("User", userSchema);