import mongoose from "mongoose";

const connectDb = async (port , app) => {
    try {
        await mongoose.connect("mongodb://127.0.0.1:27017/saharah", {
        });
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
        console.log("Connected to MongoDB");

    }
    catch (error) {
        console.error("Error:", error);
    }
};

export default connectDb;