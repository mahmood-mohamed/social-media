
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/** 
 * Function to generate expiry time for OTP
 * @param minutes number of minutes after which the OTP will expire (defaults to 5 minutes)
 * @returns Date object representing the expiry time
*/
export const generateExpiryTime = (minutes: number = 5): Date => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
}


//* Function to verify OTP
export const verifyOTP = (inputOTP: string, actualOTP: string, expiryTime: Date): boolean => {
    const currentTime = new Date();

    if (inputOTP === actualOTP && currentTime < expiryTime) {
        return true;
    } else {
        return false;
    }
}

