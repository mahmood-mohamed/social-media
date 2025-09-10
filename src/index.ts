import express from 'express';
import bootstrap from './app.controller';
import { config } from 'dotenv';
import { generateExpiryTime, generateOTP } from './utils/OTP';
config({ path: './config/dev.env' });

const app = express();

bootstrap(app, express);
app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${process.env.PORT} 🚀 `);
});

generateExpiryTime(5);

console.log('Generated OTP:', generateOTP());
