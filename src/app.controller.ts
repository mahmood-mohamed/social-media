import type { Express } from 'express';
import authRouter from './modules/auth/auth.controller';
import connectDB from './DB/connection.db';


export default function bootstrap (app: Express, express: any) {
  connectDB(); // Connect to the database
  app.use(express.json()); // for parsing application/json
  // authentication routes
  app.use('/auth', authRouter);
  // user routes
  // post routes
  // comment routes
  // like routes
  // follow routes
  // message routes
  // notification routes

  app.use('/{*dummy}', (req, res, next) => {
    return res.status(404).json({ success: false, message: 'Route not found' });
  });

  
}
