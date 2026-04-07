import Meeting from "../models/meeting.model.js";

/**
 * Socket.IO Signaling Server
 * Handles: WebRTC signaling, live chat, participant events, host controls
 */
export const initSocketServer = (io) => {
  // Track active rooms: { meetingId: Set<socketId> }
  const activeRooms = new Map();

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // ─── JOIN ROOM ────────────────────────────────────────────────────────────
    socket.on("join-room", async ({ meetingId, name, userId, isHost }) => {
      try {
        const meeting = await Meeting.findOne({ meetingId });
        if (!meeting) {
          socket.emit("error", { message: "Meeting not found" });
          return;
        }
        if (meeting.status === "ended") {
          socket.emit("error", { message: "Meeting has ended" });
          return;
        }

        // Add participant to DB
        const participant = {
          userId: userId || null,
          name,
          socketId: socket.id,
          isHost: !!isHost,
          isMuted: false,
          isCameraOff: false,
          isScreenSharing: false,
          joinedAt: new Date(),
        };

        // Remove old socket entry for same user if reconnecting
        meeting.participants = meeting.participants.filter(
          (p) => p.socketId !== socket.id
        );
        meeting.participants.push(participant);

        if (meeting.status === "waiting" && isHost) {
          meeting.status = "active";
          meeting.startedAt = new Date();
        }

        await meeting.save();

        socket.join(meetingId);

        // Track active room
        if (!activeRooms.has(meetingId)) activeRooms.set(meetingId, new Set());
        activeRooms.get(meetingId).add(socket.id);

        // Tell the new joiner who else is already in the room
        const otherParticipants = meeting.participants.filter(
          (p) => p.socketId !== socket.id
        );

        socket.emit("room-joined", {
          meetingId,
          participantId: meeting.participants.find((p) => p.socketId === socket.id)?._id,
          participants: otherParticipants,
          chatHistory: meeting.chatMessages.slice(-50),
          hostName: meeting.hostName,
          status: meeting.status,
        });

        // Notify everyone else someone joined
        socket.to(meetingId).emit("participant-joined", {
          socketId: socket.id,
          name,
          userId: userId || null,
          isHost: !!isHost,
        });

        console.log(`[Socket] ${name} joined room ${meetingId}`);
      } catch (err) {
        console.error("[Socket] join-room error:", err);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // ─── WebRTC SIGNALING ─────────────────────────────────────────────────────

    // Offer (caller -> callee)
    socket.on("offer", ({ targetSocketId, offer, meetingId }) => {
      io.to(targetSocketId).emit("offer", {
        offer,
        fromSocketId: socket.id,
        meetingId,
      });
    });

    // Answer (callee -> caller)
    socket.on("answer", ({ targetSocketId, answer, meetingId }) => {
      io.to(targetSocketId).emit("answer", {
        answer,
        fromSocketId: socket.id,
        meetingId,
      });
    });

    // ICE Candidates exchange
    socket.on("ice-candidate", ({ targetSocketId, candidate }) => {
      io.to(targetSocketId).emit("ice-candidate", {
        candidate,
        fromSocketId: socket.id,
      });
    });

    // ─── LIVE CHAT ────────────────────────────────────────────────────────────
    socket.on("send-message", async ({ meetingId, message, senderName, senderId }) => {
      try {
        if (!message?.trim()) return;

        const chatMsg = {
          senderId: senderId || socket.id,
          senderName,
          message: message.trim(),
          timestamp: new Date(),
        };

        // Save to DB
        await Meeting.findOneAndUpdate(
          { meetingId },
          { $push: { chatMessages: chatMsg } }
        );

        // Broadcast to room
        io.to(meetingId).emit("new-message", chatMsg);

        console.log(`[Chat] ${senderName} in ${meetingId}: ${message}`);
      } catch (err) {
        console.error("[Socket] send-message error:", err);
      }
    });

    // ─── MEDIA CONTROLS ───────────────────────────────────────────────────────

    // Toggle mute
    socket.on("toggle-mute", async ({ meetingId, isMuted }) => {
      try {
        await Meeting.findOneAndUpdate(
          { meetingId, "participants.socketId": socket.id },
          { $set: { "participants.$.isMuted": isMuted } }
        );

        socket.to(meetingId).emit("participant-muted", {
          socketId: socket.id,
          isMuted,
        });
      } catch (err) {
        console.error("[Socket] toggle-mute error:", err);
      }
    });

    // Toggle camera
    socket.on("toggle-camera", async ({ meetingId, isCameraOff }) => {
      try {
        await Meeting.findOneAndUpdate(
          { meetingId, "participants.socketId": socket.id },
          { $set: { "participants.$.isCameraOff": isCameraOff } }
        );

        socket.to(meetingId).emit("participant-camera-toggled", {
          socketId: socket.id,
          isCameraOff,
        });
      } catch (err) {
        console.error("[Socket] toggle-camera error:", err);
      }
    });

    // Screen sharing
    socket.on("toggle-screen-share", async ({ meetingId, isScreenSharing }) => {
      try {
        await Meeting.findOneAndUpdate(
          { meetingId, "participants.socketId": socket.id },
          { $set: { "participants.$.isScreenSharing": isScreenSharing } }
        );

        socket.to(meetingId).emit("participant-screen-share", {
          socketId: socket.id,
          isScreenSharing,
        });
      } catch (err) {
        console.error("[Socket] toggle-screen-share error:", err);
      }
    });

    // ─── HOST CONTROLS ────────────────────────────────────────────────────────

    // Host mutes a specific participant
    socket.on("host-mute-participant", ({ meetingId, targetSocketId, isMuted }) => {
      io.to(targetSocketId).emit("force-muted", { isMuted, by: "host" });
      socket.to(meetingId).emit("participant-muted", { socketId: targetSocketId, isMuted });
    });

    // Host removes a participant
    socket.on("host-remove-participant", async ({ meetingId, targetSocketId }) => {
      try {
        io.to(targetSocketId).emit("you-were-removed", { reason: "Removed by host" });

        // remove from room
        const targetSocket = io.sockets.sockets.get(targetSocketId);
        if (targetSocket) {
          targetSocket.leave(meetingId);
        }

        await Meeting.findOneAndUpdate(
          { meetingId },
          { $pull: { participants: { socketId: targetSocketId } } }
        );

        socket.to(meetingId).emit("participant-removed", { socketId: targetSocketId });
      } catch (err) {
        console.error("[Socket] host-remove-participant error:", err);
      }
    });

    // Host ends the meeting for everyone
    socket.on("host-end-meeting", async ({ meetingId }) => {
      try {
        await Meeting.findOneAndUpdate(
          { meetingId },
          { status: "ended", endedAt: new Date(), participants: [] }
        );

        io.to(meetingId).emit("meeting-ended", { message: "Meeting ended by host" });

        // disconnect all sockets in room
        const room = io.sockets.adapter.rooms.get(meetingId);
        if (room) {
          room.forEach((sid) => {
            const s = io.sockets.sockets.get(sid);
            if (s) s.leave(meetingId);
          });
        }

        activeRooms.delete(meetingId);
        console.log(`[Socket] Meeting ${meetingId} ended by host`);
      } catch (err) {
        console.error("[Socket] host-end-meeting error:", err);
      }
    });

    // ─── DISCONNECT ───────────────────────────────────────────────────────────
    socket.on("disconnecting", async () => {
      try {
        const rooms = [...socket.rooms].filter((r) => r !== socket.id);

        for (const meetingId of rooms) {
          // Find what meeting this socket was in
          const meeting = await Meeting.findOne({ meetingId });
          if (!meeting) continue;

          const participant = meeting.participants.find((p) => p.socketId === socket.id);
          const name = participant?.name || "Unknown";

          // Remove participant from DB
          await Meeting.findOneAndUpdate(
            { meetingId },
            { $pull: { participants: { socketId: socket.id } } }
          );

          // Notify others
          socket.to(meetingId).emit("participant-left", {
            socketId: socket.id,
            name,
          });

          console.log(`[Socket] ${name} left room ${meetingId}`);
        }
      } catch (err) {
        console.error("[Socket] disconnect error:", err);
      }
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });
};
