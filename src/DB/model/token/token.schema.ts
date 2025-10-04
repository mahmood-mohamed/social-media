import { Schema } from "mongoose";
import { TokenType } from "../../../utils";

export const tokenSchema = new Schema({
    userId: {
        type: String,
        ref: "User",
        required: true,
    },
    type:{
        type: String,
        enum: Object.values(TokenType),
        default: TokenType.REFRESH,
    },
    token:{
        type: String,
        required: true,
    },
    expiresAt:{
        type: Date,
        required: true,
        index: { expires: 0 }, //* TTL index to auto-delete expired tokens
    }
}, 
{ timestamps: true });
