import { Router } from "express";
import {
  createMeeting,
  getMeetingInfo,
  joinMeeting,
  endMeeting,
  getMeetingChat,
  getParticipants,
  muteParticipant,
  removeParticipant,
  getMyMeetings,
} from "../controllers/meeting.controller.js";
import { verifyToken } from "../middlewares/auth.js";

const router = Router();

// ─── Public Routes (no auth needed) ──────────────────────────────────────────
// Anyone can check meeting info and join with just a name
router.get("/:meetingId/info", getMeetingInfo);
router.post("/:meetingId/join", joinMeeting);

// ─── Protected Routes (must be logged in) ────────────────────────────────────
router.use(verifyToken); // apply auth to all routes below

// Host: Create meeting
router.post("/create", createMeeting);

// Host: Get all my meetings
router.get("/my-meetings", getMyMeetings);

// Host: End meeting
router.post("/:meetingId/end", endMeeting);

// Host: Mute a participant
router.patch("/:meetingId/participants/:participantId/mute", muteParticipant);

// Host: Remove a participant
router.delete("/:meetingId/participants/:participantId", removeParticipant);

// Both: Get participants list
router.get("/:meetingId/participants", getParticipants);

// Both: Get chat messages
router.get("/:meetingId/chat", getMeetingChat);

export default router;
