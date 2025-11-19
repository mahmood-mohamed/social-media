import { Socket } from "socket.io";
import { BadRequestError, NotFoundError, verifyToken } from "../../utils";
import { UserRepository } from "../../DB";

export const socketAuth = async (socket: Socket , next: Function) => {
    try {
        const { authorization } = socket.handshake.auth;
        const payload = verifyToken(authorization as string, "access"); // throw error if invalid token
        const userRepository = new UserRepository();
        const user = await userRepository.findOne({ _id: payload.id });
        if (!user) {
            next(new NotFoundError("User not found")); // emit >> connect_error
        }
        socket.data.user = user;
        next();
    } catch (error) {
        next(new BadRequestError("Authentication error")); // emit >> connect_error               
    }
};
