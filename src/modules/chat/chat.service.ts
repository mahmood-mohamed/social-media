import { Request, Response } from "express";
import { ChatRepository } from "../../DB";

class ChatService {
  private readonly chatRepository = new ChatRepository();

  public getChat = async (req: Request, res: Response) => {
    const { receiverId } = req.params;
    const chat = await this.chatRepository.find(
      {
        users: { $all: [receiverId, req.user._id] },
      },
      {},
      { populate: {path: "messages"}, lean: true }
    );

    return res.status(200).json({
      success: true,
      message: "Chat fetched successfully",
      data: chat,
    });
  };
}

export default new ChatService();
