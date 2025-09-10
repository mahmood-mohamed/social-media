
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateExpiryTime = (minutes: number): Date => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    return now;
}


//* Function to verify OTP
export const verifyOTP = (inputOTP: string, actualOTP: string, expiryTime: Date): boolean => {
    const currentTime = new Date();
    if (inputOTP === actualOTP && currentTime < expiryTime) {
        return true;
    }
    return false;
}

