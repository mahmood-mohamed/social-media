import { Server as httpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { socketAuth } from "./middleware";
import { sendMessage } from "./chat";

const connectedUsers = new Map<string, string>();

export const initSocketIO = (server: httpServer) => {
  const io = new Server(server, { cors: { origin: "*" } });
  io.use(socketAuth);

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.user.id;
    // Save the user ID and socket ID in the connectedUsers map
    connectedUsers.set(userId, socket.id);

    // Broadcast to everyone that this user is online
    socket.broadcast.emit("userOnline", { userId });

    // Listen for the "sendMessage" event 
    socket.on("sendMessage", sendMessage(socket, io, connectedUsers));

    // Typing event
    socket.on("typing", (destId: string) => {
      const receiverSocketId = connectedUsers.get(destId);
      if (receiverSocketId){
        io.to(receiverSocketId).emit("userTyping", {userId});
      }
    });

    // Stop typing event
    socket.on("stopTyping", (destId: string) => {
      const receiverSocketId = connectedUsers.get(destId);
      if (receiverSocketId){
        io.to(receiverSocketId).emit("userStopTyping", {userId});
      }
    });

    // Disconnect event
    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      socket.broadcast.emit("userOffline", { userId });
    });
  });

  return io;
};
