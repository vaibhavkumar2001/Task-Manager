import mongoose from "mongoose"

const connectDB = async () => {
    //try catch laga bahut important hai kyoki server connect krne mein kuch errors aate h 
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("✅ Database connected Successfully")
    } catch (error) {
        console.log("❌ Database connection failed")
        process.exit(1)
    }
}

export default connectDB