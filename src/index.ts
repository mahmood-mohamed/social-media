import express from 'express';
import bootstrap from './app.controller';
import { config } from 'dotenv';
import { devConfig } from './config/env/dev.config';
import { createServer } from 'node:http';
import { initSocketIO } from './socket-io';

config();

const app = express();
const server = createServer(app);
initSocketIO(server);

bootstrap(app, express);
server.listen(process.env.PORT, () => {
  console.log(`Server is running at http://localhost:${devConfig.port} 🚀 `);
});
