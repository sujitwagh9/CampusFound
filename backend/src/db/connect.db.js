import mongoose from 'mongoose';
import { config } from '../config.js';

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUrl);
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        process.exit(1);
    }
}

export default connectDB;
