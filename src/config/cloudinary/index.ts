import { v2 as cloudinary } from "cloudinary";
import { devConfig } from "../env/dev.config";

cloudinary.config({
  cloud_name: devConfig.cloudinaryCloudName as string,
  api_key: devConfig.cloudinaryApiKey as string,
  api_secret: devConfig.cloudinaryApiSecret as string,
});
export default cloudinary;

