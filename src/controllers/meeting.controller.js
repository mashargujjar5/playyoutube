import Meeting from "../models/meeting.model.js";
import { v4 as uuidv4 } from "uuid";

// ─── Helper ──────────────────────────────────────────────────────────────────
const generateMeetingId = () => uuidv4().replace(/-/g, "").substring(0, 12).toUpperCase();

// ─── Create Meeting ───────────────────────────────────────────────────────────
export const createMeeting = async (req, res) => {
  try {
    const { title } = req.body;
    const hostId = req.user.id;
    const hostName = req.user.username;

    const meetingId = generateMeetingId();

    const meeting = await Meeting.create({
      meetingId,
      title: title || "Untitled Meeting",
      hostId,
      hostName,
      status: "waiting",
      participants: [],
      chatMessages: [],
    });

    return res.status(201).json({
      success: true,
      message: "Meeting created successfully",
      data: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        status: meeting.status,
        joinLink: `/meeting/${meeting.meetingId}`,
        createdAt: meeting.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating meeting:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};

// ─── Get Meeting Info ─────────────────────────────────────────────────────────
export const getMeetingInfo = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId }).select("-chatMessages");
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        status: meeting.status,
        participantCount: meeting.participants.length,
        startedAt: meeting.startedAt,
        endedAt: meeting.endedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching meeting:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Join Meeting (validate) ──────────────────────────────────────────────────
export const joinMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required to join" });
    }

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    if (meeting.status === "ended") {
      return res.status(400).json({ success: false, message: "This meeting has ended" });
    }
    if (meeting.participants.length >= meeting.maxParticipants) {
      return res.status(400).json({ success: false, message: "Meeting is full" });
    }

    return res.status(200).json({
      success: true,
      message: "You can join the meeting",
      data: {
        meetingId: meeting.meetingId,
        title: meeting.title,
        hostName: meeting.hostName,
        status: meeting.status,
      },
    });
  } catch (error) {
    console.error("Error joining meeting:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── End Meeting (Host Only) ──────────────────────────────────────────────────
export const endMeeting = async (req, res) => {
  try {
    const { meetingId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    if (meeting.hostId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the host can end the meeting" });
    }
    if (meeting.status === "ended") {
      return res.status(400).json({ success: false, message: "Meeting already ended" });
    }

    meeting.status = "ended";
    meeting.endedAt = new Date();
    await meeting.save();

    return res.status(200).json({
      success: true,
      message: "Meeting ended successfully",
      data: { meetingId, endedAt: meeting.endedAt },
    });
  } catch (error) {
    console.error("Error ending meeting:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Get Meeting Chat ─────────────────────────────────────────────────────────
export const getMeetingChat = async (req, res) => {
  try { 
    const { meetingId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const meeting = await Meeting.findOne({ meetingId }).select("chatMessages status");
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    const skip = (page - 1) * limit;
    const messages = meeting.chatMessages.slice(skip, skip + parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        messages,
        total: meeting.chatMessages.length,
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching chat:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Get Participants ─────────────────────────────────────────────────────────
export const getParticipants = async (req, res) => {
  try {
    const { meetingId } = req.params;

    const meeting = await Meeting.findOne({ meetingId }).select("participants status");
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        participants: meeting.participants,
        total: meeting.participants.length,
      },
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Mute Participant (Host) ──────────────────────────────────────────────────
export const muteParticipant = async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const { isMuted } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    if (meeting.hostId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the host can mute participants" });
    }

    const participant = meeting.participants.id(participantId);
    if (!participant) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    participant.isMuted = isMuted !== undefined ? isMuted : true;
    await meeting.save();

    return res.status(200).json({
      success: true,
      message: `Participant ${participant.isMuted ? "muted" : "unmuted"} successfully`,
      data: { participantId, isMuted: participant.isMuted },
    });
  } catch (error) {
    console.error("Error muting participant:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Remove Participant (Host) ────────────────────────────────────────────────
export const removeParticipant = async (req, res) => {
  try {
    const { meetingId, participantId } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findOne({ meetingId });
    if (!meeting) {
      return res.status(404).json({ success: false, message: "Meeting not found" });
    }
    if (meeting.hostId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Only the host can remove participants" });
    }

    const participantIndex = meeting.participants.findIndex(
      (p) => p._id.toString() === participantId
    );
    if (participantIndex === -1) {
      return res.status(404).json({ success: false, message: "Participant not found" });
    }

    const removedParticipant = meeting.participants[participantIndex];
    meeting.participants.splice(participantIndex, 1);
    await meeting.save();

    return res.status(200).json({
      success: true,
      message: "Participant removed successfully",
      data: { participantId, name: removedParticipant.name },
    });
  } catch (error) {
    console.error("Error removing participant:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ─── Get Host's Past Meetings ─────────────────────────────────────────────────
export const getMyMeetings = async (req, res) => {
  try {
    const hostId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const filter = { hostId };
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .select("-chatMessages -participants")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        meetings,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching meetings:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};
