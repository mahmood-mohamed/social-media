import { Server, Socket } from "socket.io";
import { ChatRepository, MessageRepository } from "../../DB";
import { ObjectId } from "mongoose";
import { sendMessageSchema } from "./message.validation";
import { validateSocketData } from "./helper";
import z from "zod";

interface ISendMessage {
  message: string;
  destId: string;
}
export const sendMessage = (
  socket: Socket,
  io: Server,
  connectedUsers: Map<string, string>
) => {
  return async (data: ISendMessage) => {
    try {
      const validateData = validateSocketData(sendMessageSchema, data);
      
      const receiverSocketId = connectedUsers.get(validateData.destId);
      // Two ways to emit >> successMessage >> receiveMessage
      socket.emit("successMessage", validateData);
      if (receiverSocketId)
        io.to(receiverSocketId).emit("receiveMessage", validateData);

      // create & save message in DB
      const messageRepo = new MessageRepository();
      const sender = socket.data.user._id;
      const createdMessage = await messageRepo.create({
        sender,
        content: validateData.message,
      });
      
      const chatRepo = new ChatRepository();
      // find chat between sender & receiver
      const chat = await chatRepo.findOne({
        users: { $all: [ sender, data.destId ] }
      });
      
      // create chat if not exist
      if(!chat) {
        await chatRepo.create({
          users: [sender, data.destId],
          messages: [createdMessage._id as ObjectId]
        });
      }else {
        // add message to chat
        await chatRepo.update(
          { _id: chat._id },
          {$push: { messages: createdMessage._id }}
        );
      }
    } catch (error) {
      // Handle validation errors
      if (error instanceof z.ZodError) {
        const firstIssue = error.issues?.[0];
        socket.emit("errorMessage", { 
          message: firstIssue?.message || "Invalid message format."
        });
        return;
      }
      // Handle unknown errors
      console.error("Error sending message:", error);
      socket.emit("errorMessage", {
        message: "Internal server error while sending message.",
      });
    }
  };
};
