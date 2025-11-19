import type { Express, NextFunction, Request, Response } from "express";
import { connectDB } from "./DB";
import { AppError } from "./utils";
import cors from "cors";
import { adminRouter, authRouter, chatRouter, commentRouter, friendsRouter, postRouter, userRouter } from "./modules";

export default function bootstrap(app: Express, express: any) {
  connectDB(); // Connect to the database
  app.use(express.json()); // for parsing application/json
  app.use(cors({  // Enable CORS for all routes
    origin: "*", // Replace with your frontend URL
    credentials: true,  // Allow cookies to be sent
  }));
  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/post", postRouter);
  app.use("/comment", commentRouter);
  app.use("/admin", adminRouter);
  app.use("/friends", friendsRouter);
  app.use("/chat", chatRouter);

  app.use("/{*dummy}", (req: Request, res: Response, next: NextFunction) => {
    return res.status(404).json({ success: false, message: "Route not found" });
  });


  app.use((err: AppError, req: Request, res: Response, next: NextFunction) => {
    return res
      .status(err.statusCode || 500)
      .json({
        success: false,
        message: err.message,
        errorDetails: err.errorDetails,
        stack: err.stack,
      });
  });
}
