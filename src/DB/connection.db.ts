import mongoose from "mongoose";
import { devConfig } from "../config/env/dev.config";


export  async function connectDB() {
    await mongoose
    .connect(devConfig.dbUrl)
    .then(() => console.log('Connected to MongoDB successfully ✅' ))
    .catch ((error) =>  console.error('Error connecting to MongoDB: ⛔⛔ ', error));
}
