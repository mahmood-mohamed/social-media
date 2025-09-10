// DTO >> Data Transfer Object
//* It is used to define the shape of data that is sent over the network, 
//  typically in the context of API requests and responses.

//* DTOs help in validating and structuring the data, 
//  ensuring that it adheres to the expected format before being processed by the application logic.

import { Gender } from "../../utils/common/enum";

export interface IRegisterDTO {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  gender: Gender;
}

export interface ILoginDTO {
  email: string;
  password: string;
}
