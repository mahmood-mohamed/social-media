import type { Express, NextFunction, Request, Response } from "express";
import { connectDB } from "./DB";
import { AppError } from "./utils";
import cors from "cors";
import { adminRouter, authRouter, commentRouter, friendsRouter, postRouter, userRouter } from "./modules";

export default function bootstrap(app: Express, express: any) {
  connectDB(); // Connect to the database
  app.use(express.json()); // for parsing application/json
  app.use(cors({  // Enable CORS for all routes
    origin: "http://localhost:5173", // Replace with your frontend URL
    credentials: true,  // Allow cookies to be sent
  }));
  // authentication routes
  app.use("/auth", authRouter);
  // user routes
  app.use("/user", userRouter);
  // post routes
  app.use("/post", postRouter);
  // comment routes
  app.use("/comment", commentRouter); // 🔥 for reply out post 
  // admin routes
  app.use("/admin", adminRouter);
  // friends routes
  app.use("/friends", friendsRouter);


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
