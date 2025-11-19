import { Schema } from "mongoose";
import { IMessage } from "../../../utils";

export const messageSchema = new Schema<IMessage>(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, trim: true, required: true },
  },
  { timestamps: true }
);
