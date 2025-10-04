import express from 'express';
import bootstrap from './app.controller';
import { config } from 'dotenv';
import { devConfig } from './config/env/dev.config';

config();

const app = express();

bootstrap(app, express);
app.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${devConfig.port} 🚀 `);
});
