import mongoose from "mongoose";


export  async function connectDB() {
    await mongoose
    .connect(process.env.DB_URL as string)
    .then(() => console.log('Connected to MongoDB successfully ✅' ))
    .catch ((error) =>  console.error('Error connecting to MongoDB: ⛔⛔ ', error));
}
