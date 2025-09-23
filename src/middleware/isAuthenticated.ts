import { NextFunction, Request, Response } from "express";


export const isAuthenticated = (req: Request, res: Response) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        const token = req.headers.authorization;
        const isVerified = 
        next();
    };
};
