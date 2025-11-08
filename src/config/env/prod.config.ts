import { config } from 'dotenv';

config();

export const prodConfig = {
    port: process.env.PORT || '3000',

    dbUrl: process.env.DB_URL || '',

    accessTokenSecret: process.env.ACCESS_TOKEN_SECRET || '',
    refreshTokenSecret: process.env.REFRESH_TOKEN_SECRET || '',

    emailUsername: process.env.EMAIL_USERNAME || '',
    emailPassword: process.env.EMAIL_PASSWORD || '',

    cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
    cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
    
    defaultProfilePictureMale: process.env.DEFAULT_AVATAR_MALE_URL || '',
    defaultProfilePictureFemale: process.env.DEFAULT_AVATAR_FEMALE_URL || '',
};

// Note: In a production environment, ensure that the secrets are strong and not hard-coded. Use environment variables or a secrets manager.
