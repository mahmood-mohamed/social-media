import { Schema } from "mongoose";
import { IChat } from "../../../utils";


export const chatSchema = new Schema<IChat>({
    users: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    messages: [{ type: Schema.Types.ObjectId, ref: "Message", required: true }],
}, { timestamps: true });
