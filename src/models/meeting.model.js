import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  name: { type: String, required: true },
  socketId: { type: String },
  isHost: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  isCameraOff: { type: Boolean, default: false },
  isScreenSharing: { type: Boolean, default: false },
  joinedAt: { type: Date, default: Date.now },
});

const chatMessageSchema = new mongoose.Schema({
  senderId: { type: String },
  senderName: { type: String, required: true },
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const meetingSchema = new mongoose.Schema(
  {
    meetingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      default: "Untitled Meeting",
      trim: true,
    },
    hostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hostName: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
    },
    participants: [participantSchema],
    chatMessages: [chatMessageSchema],
    startedAt: { type: Date },
    endedAt: { type: Date },
    maxParticipants: { type: Number, default: 50 },
    isRecording: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", meetingSchema);
