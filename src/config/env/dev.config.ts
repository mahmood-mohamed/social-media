import { config } from 'dotenv';
config();

export const devConfig: Record<string, string> = {
    port: process.env.PORT || '' ,

    dbUrl: process.env.DB_URL || '' ,

    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || '',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '',

    emailUsername: process.env.EMAIL_USERNAME || '',
    emailPassword: process.env.EMAIL_PASSWORD || '',

    googleClientId: process.env.GOOGLE_CLIENT_ID || '',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',

    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',

    defaultProfilePictureMale: process.env.DEFAULT_AVATAR_MALE_URL || '',
    defaultProfilePictureFemale: process.env.DEFAULT_AVATAR_FEMALE_URL || '',
};
