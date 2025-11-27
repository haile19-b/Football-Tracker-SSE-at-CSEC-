import mongoose from "mongoose";

export const ConnectDB = async()=>{
    try {
        await mongoose.connect(process.env.MONGO_DB);
        console.log("Data base Connected Successfully!")
    } catch (error) {
        console.log("Database Connection fails!")
    }
}