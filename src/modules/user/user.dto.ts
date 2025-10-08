
export interface IUpdateLoggedInUserPasswordDTO{
  password: string;
  newPassword: string;
  confirmNewPassword: string;
}


export interface IUpdateEmailDTO{
  email: string;
}

export interface updateUserEmailDTO{
  otpOldEmail: string;
  otpNewEmail: string;
}
