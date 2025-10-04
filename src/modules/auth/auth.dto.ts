// DTO >> Data Transfer Object
//* It is used to define the shape of data that is sent over the network,
//  typically in the context of API requests and responses.

//* DTOs help in validating and structuring the data,
//  ensuring that it adheres to the expected format before being processed by the application logic.

import { Gender } from "../../utils/common/enums";

export interface IRegisterDTO {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: Gender;
}

export interface ILoginDTO {
  email: string;
  password: string;
}

export interface IVerifyAccountDTO {
  email: string;
  otp: string;
}

export interface IResendOtpDTO {
  email: string;
}

export interface IForgetPasswordDTO {
  email: string;
}

export interface IResetPasswordDTO {
  email: string;
  otp: string;
  newPassword: string;
  confirmNewPassword: string;
}

export interface IGoogleLoginDTO {
  idToken: string;
}

export interface IUpdateLoggedInUserPasswordDTO{
  password: string;
  newPassword: string;
  confirmNewPassword: string;
}
