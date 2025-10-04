import { config } from 'dotenv';
config();

export const devConfig = {
    port: process.env.PORT || 3000,

    dbUrl: process.env.DB_URL || 'mongodb://127.0.0.1:27017/social-app',

    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || '1f3c1a8fdd6b9d1b2a7a3b6e9c5f8d2a0e3c4d9f5b1a2c8f6e7d4a1c9e2b5f7',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '8a2d6c9f1b3e4a7d5c9f2a1b7e6c4d9a3f1b2e8d5a7c6f9b3e4d2a5c8f1e7a9',

    emailUsername: process.env.EMAIL_USERNAME || 'firstyear265@gmail.com',
    emailPassword: process.env.EMAIL_PASSWORD || 'midcsaegkkaoimlt',

    googleClientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
};
