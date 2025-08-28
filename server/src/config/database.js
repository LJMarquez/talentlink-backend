import mongoose from "mongoose";

export const connectServerDB = async () => {
    try {
        const serverDB = await mongoose.createConnection(process.env.MONGO_URI);
        console.log('Server database connected');
        return serverDB;
    } catch (error) {
        console.error('Server database connection error:', error);
        process.exit(1);
    }
};
